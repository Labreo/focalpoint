"""
Unit tests for Rekognition client wrapper in FocalPoint
"""
import unittest
from unittest.mock import MagicMock
import sys
import os

# Add handlers directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'handlers')))

from rekognition_client import detect_text_lines, detect_faces

class TestRekognitionClient(unittest.TestCase):

    def test_detect_text_lines_filters_confidence_and_normalizes(self):
        mock_rekog = MagicMock()
        mock_rekog.detect_text.return_value = {
            "TextDetections": [
                {
                    "Type": "LINE",
                    "Confidence": 96.5,
                    "DetectedText": "BREAKING NEWS: Historic Climate Accord Signed",
                    "Geometry": {
                        "BoundingBox": {"Left": 0.05, "Top": 0.82, "Width": 0.90, "Height": 0.08}
                    }
                },
                {
                    "Type": "WORD",
                    "Confidence": 98.0,
                    "DetectedText": "BREAKING",
                    "Geometry": {
                        "BoundingBox": {"Left": 0.05, "Top": 0.82, "Width": 0.15, "Height": 0.08}
                    }
                },
                {
                    "Type": "LINE",
                    "Confidence": 55.0,  # Below minimum confidence threshold
                    "DetectedText": "Blurry background banner",
                    "Geometry": {
                        "BoundingBox": {"Left": 0.1, "Top": 0.1, "Width": 0.2, "Height": 0.05}
                    }
                }
            ]
        }

        results = detect_text_lines(mock_rekog, b"dummy_bytes", min_confidence=75.0)

        self.assertEqual(len(results), 1)
        item = results[0]
        self.assertEqual(item["type"], "TEXT_BLOCK")
        self.assertEqual(item["text"], "BREAKING NEWS: Historic Climate Accord Signed")
        self.assertEqual(item["confidence"], 0.965)
        self.assertEqual(item["box"]["left"], 0.05)
        self.assertEqual(item["box"]["top"], 0.82)
        self.assertEqual(item["box"]["width"], 0.90)
        self.assertEqual(item["box"]["height"], 0.08)

    def test_detect_faces_extracts_landmarks_and_emotions(self):
        mock_rekog = MagicMock()
        mock_rekog.detect_faces.return_value = {
            "FaceDetails": [
                {
                    "Confidence": 99.2,
                    "BoundingBox": {"Left": 0.65, "Top": 0.20, "Width": 0.25, "Height": 0.40},
                    "MouthOpen": {"Value": True, "Confidence": 94.0},
                    "Emotions": [{"Type": "HAPPY", "Confidence": 88.0}]
                }
            ]
        }

        results = detect_faces(mock_rekog, b"dummy_bytes", min_confidence=80.0)

        self.assertEqual(len(results), 1)
        face = results[0]
        self.assertEqual(face["type"], "FACIAL_PORTRAIT")
        self.assertEqual(face["confidence"], 0.992)
        self.assertTrue(face["attributes"]["mouthOpen"])
        self.assertEqual(face["attributes"]["dominantEmotion"], "HAPPY")

    def test_handles_exception_gracefully(self):
        mock_rekog = MagicMock()
        mock_rekog.detect_text.side_effect = RuntimeError("AWS Connection Lost")

        results = detect_text_lines(mock_rekog, b"bytes")
        self.assertEqual(results, [])

if __name__ == '__main__':
    unittest.main()
