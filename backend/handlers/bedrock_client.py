"""
Bedrock Client Adapter for FocalPoint
Decomposes unstructured broadcast UI elements (sports scoreboards, news chyrons, lecture slides)
using Anthropic Claude 3.5 Sonnet on Amazon Bedrock.
"""
import base64
import json
import logging
import re
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

SCENE_DECOMPOSITION_PROMPT = """You are the multimodal computer vision engine for FocalPoint, an ophthalmic assistive system for people with severe low vision (Macular Degeneration, Retinitis Pigmentosa).

Analyze this image broadcast frame and identify high-priority non-text or compound visual structures:
1. Sports scoreboards or live match telemetry (teams, scores, overs, run rates).
2. Broadcast news chyrons, tickers, or breaking alerts.
3. Slide titles, lecture diagrams, or presentation outlines.

Return ONLY a valid JSON object matching this exact schema:
{
  "hudElements": [
    {
      "description": "Short human-readable label, e.g. 'Match Scoreboard: IND 287/4'",
      "type": "PERSISTENT_HUD",
      "box": {
        "left": 0.05,
        "top": 0.05,
        "width": 0.35,
        "height": 0.12
      },
      "suggestedAnchor": "BOTTOM_RIGHT",
      "metrics": {
        "primaryMetric": "287/4",
        "secondaryMetric": "Overs: 42.3"
      }
    }
  ]
}

All box values must be normalized floats between 0.0 and 1.0. Do not enclose the output in markdown fences or conversational preambles."""

def classify_scene_elements(
    bedrock_client: Any,
    image_bytes: bytes,
    model_id: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"
) -> List[Dict[str, Any]]:
    """
    Invokes Claude 3.5 Sonnet on Bedrock to extract HUD and high-priority broadcast structures.
    """
    try:
        b64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 600,
            "temperature": 0.1,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": b64_image
                            }
                        },
                        {
                            "type": "text",
                            "text": SCENE_DECOMPOSITION_PROMPT
                        }
                    ]
                }
            ]
        }

        response = bedrock_client.invoke_model(
            modelId=model_id,
            body=json.dumps(request_body)
        )
        
        raw_body = response.get('body').read().decode('utf-8')
        res_json = json.loads(raw_body)
        content_text = res_json.get('content', [{}])[0].get('text', '{}')
        
        # Clean potential markdown formatting (```json ... ```)
        cleaned_text = re.sub(r'^```(?:json)?\s*', '', content_text.strip(), flags=re.MULTILINE)
        cleaned_text = re.sub(r'\s*```$', '', cleaned_text.strip(), flags=re.MULTILINE)
        
        parsed = json.loads(cleaned_text)
        hud_elements = parsed.get("hudElements", [])
        
        valid_elements: List[Dict[str, Any]] = []
        for elem in hud_elements:
            box = elem.get('box', {})
            left = max(0.0, min(1.0, float(box.get('left', 0.0))))
            top = max(0.0, min(1.0, float(box.get('top', 0.0))))
            width = max(0.0, min(1.0 - left, float(box.get('width', 0.1))))
            height = max(0.0, min(1.0 - top, float(box.get('height', 0.1))))
            
            valid_elements.append({
                "type": "PERSISTENT_HUD",
                "description": elem.get('description', 'Detected HUD Overlay'),
                "box": {
                    "left": round(left, 4),
                    "top": round(top, 4),
                    "width": round(width, 4),
                    "height": round(height, 4)
                },
                "suggestedAnchor": elem.get('suggestedAnchor', 'BOTTOM_RIGHT'),
                "metrics": elem.get('metrics', {})
            })
        return valid_elements

    except Exception as exc:
        logger.warning(f"Bedrock scene classification encountered error: {exc}. Returning graceful empty fallback.")
        return []
