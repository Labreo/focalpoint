"""
AWS Lambda Vision Orchestrator for FocalPoint
Coordinates concurrent multimodal fan-out across Rekognition and Bedrock,
merges results into an Intent-Aware Semantic Region Map, and serves profile requests.
"""
import base64
import json
import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict

try:
    import boto3
    from botocore.config import Config
except ImportError:
    boto3 = None
    Config = None

from rekognition_client import detect_faces, detect_text_lines
from bedrock_client import classify_scene_elements
from synthesizer import merge_semantic_regions
from user_profile import get_profile, save_profile

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

# Initialize AWS clients conditionally (allows unit testing with mocks)
if boto3 and Config:
    try:
        boto_config = Config(
            retries={"max_attempts": 3, "mode": "standard"},
            connect_timeout=3,
            read_timeout=12
        )
        rekog_client = boto3.client("rekognition", config=boto_config)
        bedrock_client = boto3.client("bedrock-runtime", config=boto_config)
        dynamodb_resource = boto3.resource("dynamodb", config=boto_config)
        user_table = dynamodb_resource.Table(os.environ.get("USER_PROFILES_TABLE", "FocalPoint_UserProfiles"))
        cloudwatch_client = boto3.client("cloudwatch", config=boto_config)
    except Exception as init_err:
        logger.warning(f"AWS Client initialization warning: {init_err}")
        rekog_client = None
        bedrock_client = None
        dynamodb_resource = None
        user_table = None
        cloudwatch_client = None
else:
    rekog_client = None
    bedrock_client = None
    dynamodb_resource = None
    user_table = None
    cloudwatch_client = None

BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0")

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
}

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda entry point handling API Gateway HTTP requests.
    """
    http_method = event.get("httpMethod", "POST").upper()
    path = event.get("path", "")

    # Handle CORS Preflight
    if http_method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"message": "CORS preflight successful"})
        }

    # Route: GET /api/v1/profiles/{userId}
    if http_method == "GET" and "/api/v1/profiles" in path:
        path_params = event.get("pathParameters") or {}
        user_id = path_params.get("userId", "usr_default")
        profile = get_profile(user_table, user_id)
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps(profile)
        }

    # Route: POST /api/v1/profiles
    if http_method == "POST" and path == "/api/v1/profiles":
        try:
            body = json.loads(event.get("body", "{}"))
            user_id = body.get("userId", "usr_default")
            saved = save_profile(user_table, user_id, body)
            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps(saved)
            }
        except Exception as err:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": f"Invalid profile payload: {err}"})
            }

    # Route: POST /api/v1/analyze-frame
    start_time = time.time()
    try:
        raw_body = event.get("body", "{}")
        if event.get("isBase64Encoded", False):
            raw_body = base64.b64decode(raw_body).decode("utf-8")

        payload = json.loads(raw_body)
        user_id = payload.get("userId", "usr_anonymous")
        image_base64 = payload.get("imageBase64", "")
        frame_metadata = payload.get("frameMetadata", {})

        if not image_base64:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Missing imageBase64 in request body."})
            }

        # Strip data URL prefix if present
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]

        image_bytes = base64.b64decode(image_base64)

        # Retrieve user pathology profile for contrast and threshold personalization
        user_profile = get_profile(user_table, user_id)
        contrast_theme = user_profile.get("preferredContrastTheme", "YELLOW_ON_BLACK")

        # Asynchronous Fan-Out across Rekognition and Bedrock
        text_results = []
        face_results = []
        hud_results = []

        with ThreadPoolExecutor(max_workers=3) as executor:
            fut_text = executor.submit(detect_text_lines, rekog_client, image_bytes) if rekog_client else None
            fut_faces = executor.submit(detect_faces, rekog_client, image_bytes) if rekog_client else None
            fut_bedrock = executor.submit(classify_scene_elements, bedrock_client, image_bytes, BEDROCK_MODEL_ID) if bedrock_client else None

            if fut_text:
                text_results = fut_text.result()
            if fut_faces:
                face_results = fut_faces.result()
            if fut_bedrock:
                hud_results = fut_bedrock.result()

        # Merge results into unified SemanticRegionMap
        synthesized_regions = merge_semantic_regions(
            texts=text_results,
            faces=face_results,
            huds=hud_results,
            user_contrast_theme=contrast_theme
        )

        elapsed_ms = int((time.time() - start_time) * 1000)
        request_id = getattr(context, "aws_request_id", f"req_{int(time.time())}")

        response_payload = {
            "frameId": f"frm_{request_id[:8]}",
            "processedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "processingLatencyMs": elapsed_ms,
            "dimensions": {
                "width": frame_metadata.get("width", 1920),
                "height": frame_metadata.get("height", 1080)
            },
            "userProfileSummary": {
                "pathologyType": user_profile.get("pathologyType", "AMD"),
                "dwellThresholdMs": user_profile.get("dwellThresholdMs", 280)
            },
            "regions": synthesized_regions
        }

        # Put CloudWatch metrics asynchronously if available
        if cloudwatch_client:
            try:
                cloudwatch_client.put_metric_data(
                    Namespace="FocalPoint/Inference",
                    MetricData=[
                        {"MetricName": "OrchestrationLatencyMs", "Value": elapsed_ms, "Unit": "Milliseconds"},
                        {"MetricName": "ExtractedRegionsCount", "Value": len(synthesized_regions), "Unit": "Count"}
                    ]
                )
            except Exception as cw_err:
                logger.debug(f"CloudWatch metric put skipped: {cw_err}")

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps(response_payload)
        }

    except Exception as exc:
        logger.error(f"Orchestration failure: {exc}", exc_info=True)
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": f"Internal server error in FocalPoint orchestrator: {str(exc)}"})
        }
