"""
Unit tests for AWS Lambda Orchestrator in FocalPoint
"""
import unittest
from unittest.mock import patch, MagicMock
import json
import base64
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'handlers')))

import orchestrator

class TestLambdaOrchestrator(unittest.TestCase):

    def test_cors_preflight(self):
        event = {"httpMethod": "OPTIONS"}
        response = orchestrator.lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        self.assertIn("Access-Control-Allow-Origin", response["headers"])
        self.assertEqual(response["headers"]["Access-Control-Allow-Origin"], "*")

    def test_get_user_profile(self):
        event = {
            "httpMethod": "GET",
            "path": "/api/v1/profiles/usr_kanak_001",
            "pathParameters": {"userId": "usr_kanak_001"}
        }
        response = orchestrator.lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(body["pathologyType"], "AMD")
        self.assertEqual(body["dwellThresholdMs"], 280)

    def test_save_user_profile(self):
        event = {
            "httpMethod": "POST",
            "path": "/api/v1/profiles",
            "body": json.dumps({
                "userId": "usr_kanak_001",
                "pathologyType": "TUNNEL_VISION",
                "dwellThresholdMs": 320
            })
        }
        response = orchestrator.lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(body["pathologyType"], "TUNNEL_VISION")
        self.assertEqual(body["dwellThresholdMs"], 320)

    @patch("orchestrator.detect_text_lines")
    @patch("orchestrator.detect_faces")
    @patch("orchestrator.classify_scene_elements")
    def test_analyze_frame_success(self, mock_bedrock, mock_faces, mock_text):
        mock_text.return_value = [
            {
                "type": "TEXT_BLOCK",
                "text": "Breaking News",
                "confidence": 0.99,
                "box": {"left": 0.05, "top": 0.85, "width": 0.90, "height": 0.10}
            }
        ]
        mock_faces.return_value = []
        mock_bedrock.return_value = []

        fake_image = base64.b64encode(b"fake_jpeg_bytes").decode("utf-8")
        event = {
            "httpMethod": "POST",
            "path": "/api/v1/analyze-frame",
            "body": json.dumps({
                "userId": "usr_test",
                "imageBase64": fake_image,
                "frameMetadata": {"width": 1920, "height": 1080}
            })
        }
        mock_context = MagicMock()
        mock_context.aws_request_id = "test-request-id-123"

        response = orchestrator.lambda_handler(event, mock_context)
        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertTrue(body["frameId"].startswith("frm_"))
        self.assertIn("regions", body)
        self.assertGreater(len(body["regions"]), 0)

    def test_analyze_frame_missing_image(self):
        event = {
            "httpMethod": "POST",
            "path": "/api/v1/analyze-frame",
            "body": json.dumps({"userId": "usr_test"})
        }
        response = orchestrator.lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 400)
        body = json.loads(response["body"])
        self.assertIn("error", body)

if __name__ == '__main__':
    unittest.main()
