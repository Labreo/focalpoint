"""
Rekognition Client Adapter for FocalPoint
Extracts text lines and facial portraits with confidence scoring and geometry normalization.
"""
from typing import Any, Dict, List
import logging

logger = logging.getLogger(__name__)

def detect_text_lines(rekog_client: Any, image_bytes: bytes, min_confidence: float = 75.0) -> List[Dict[str, Any]]:
    """
    Invokes Amazon Rekognition DetectText and filters for high-confidence text lines.
    Coordinates are normalized [0.0, 1.0].
    """
    try:
        response = rekog_client.detect_text(Image={'Bytes': image_bytes})
        lines: List[Dict[str, Any]] = []
        
        for item in response.get('TextDetections', []):
            if item.get('Type') == 'LINE':
                confidence = float(item.get('Confidence', 0.0))
                if confidence >= min_confidence:
                    box = item.get('Geometry', {}).get('BoundingBox', {})
                    # Clamp bounding box coordinates to [0.0, 1.0]
                    left = max(0.0, min(1.0, float(box.get('Left', 0.0))))
                    top = max(0.0, min(1.0, float(box.get('Top', 0.0))))
                    width = max(0.0, min(1.0 - left, float(box.get('Width', 0.0))))
                    height = max(0.0, min(1.0 - top, float(box.get('Height', 0.0))))

                    lines.append({
                        "type": "TEXT_BLOCK",
                        "text": item.get('DetectedText', '').strip(),
                        "confidence": round(confidence / 100.0, 4),
                        "box": {
                            "left": round(left, 4),
                            "top": round(top, 4),
                            "width": round(width, 4),
                            "height": round(height, 4)
                        }
                    })
        return lines
    except Exception as exc:
        logger.error(f"Rekognition DetectText failed: {exc}")
        return []

def detect_faces(rekog_client: Any, image_bytes: bytes, min_confidence: float = 80.0) -> List[Dict[str, Any]]:
    """
    Invokes Amazon Rekognition DetectFaces to locate human speakers for lip-reading enhancement.
    """
    try:
        response = rekog_client.detect_faces(Image={'Bytes': image_bytes}, Attributes=['ALL'])
        faces: List[Dict[str, Any]] = []

        for detail in response.get('FaceDetails', []):
            confidence = float(detail.get('Confidence', 0.0))
            if confidence >= min_confidence:
                box = detail.get('BoundingBox', {})
                left = max(0.0, min(1.0, float(box.get('Left', 0.0))))
                top = max(0.0, min(1.0, float(box.get('Top', 0.0))))
                width = max(0.0, min(1.0 - left, float(box.get('Width', 0.0))))
                height = max(0.0, min(1.0 - top, float(box.get('Height', 0.0))))

                # Extract key facial landmarks and lip-reading attributes
                mouth_open = detail.get('MouthOpen', {}).get('Value', False)
                emotions = detail.get('Emotions', [])
                dominant_emotion = emotions[0].get('Type', 'CALM') if emotions else 'NEUTRAL'

                faces.append({
                    "type": "FACIAL_PORTRAIT",
                    "confidence": round(confidence / 100.0, 4),
                    "box": {
                        "left": round(left, 4),
                        "top": round(top, 4),
                        "width": round(width, 4),
                        "height": round(height, 4)
                    },
                    "attributes": {
                        "mouthOpen": mouth_open,
                        "dominantEmotion": dominant_emotion
                    }
                })
        return faces
    except Exception as exc:
        logger.error(f"Rekognition DetectFaces failed: {exc}")
        return []
