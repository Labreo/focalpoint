"""
Semantic Region Synthesizer for FocalPoint
Merges multimodal inference streams (Rekognition Text, Rekognition Faces, Bedrock HUDs),
resolves spatial overlaps via Intersection-over-Union (IoU), and assigns ophthalmic adaptation strategies.
"""
from typing import Any, Dict, List
import uuid

def calculate_iou(box_a: Dict[str, float], box_b: Dict[str, float]) -> float:
    """Computes Intersection over Union for two normalized bounding boxes."""
    x_a = max(box_a['left'], box_b['left'])
    y_a = max(box_a['top'], box_b['top'])
    x_b = min(box_a['left'] + box_a['width'], box_b['left'] + box_b['width'])
    y_b = min(box_a['top'] + box_a['height'], box_b['top'] + box_b['height'])

    inter_width = max(0.0, x_b - x_a)
    inter_height = max(0.0, y_b - y_a)
    intersection = inter_width * inter_height

    area_a = box_a['width'] * box_a['height']
    area_b = box_b['width'] * box_b['height']
    union = area_a + area_b - intersection

    if union <= 0.0:
        return 0.0
    return intersection / union

def merge_semantic_regions(
    texts: List[Dict[str, Any]],
    faces: List[Dict[str, Any]],
    huds: List[Dict[str, Any]],
    user_contrast_theme: str = "YELLOW_ON_BLACK"
) -> List[Dict[str, Any]]:
    """
    Synthesizes discrete entity lists into a unified SemanticRegion list.
    Prioritizes HUDs, then Faces, then Text lines.
    """
    regions: List[Dict[str, Any]] = []

    # 1. Add HUD / Scoreboard elements (highest persistence priority)
    for idx, hud in enumerate(huds):
        region_id = f"reg_hud_{idx + 1}"
        regions.append({
            "id": region_id,
            "type": "PERSISTENT_HUD",
            "boundingBox": hud["box"],
            "confidence": 0.95,
            "textContent": hud.get("description", "Persistent HUD"),
            "extractedMetrics": hud.get("metrics", {}),
            "adaptationStrategy": {
                "action": "PIN_TO_PERIPHERY",
                "anchorCorner": hud.get("suggestedAnchor", "BOTTOM_RIGHT"),
                "scaleFactor": 1.75
            }
        })

    # 2. Add Faces for lip-reading and emotional stabilization
    for idx, face in enumerate(faces):
        # Avoid duplicate if already covered by another face
        is_duplicate = False
        for existing in regions:
            if existing["type"] == "FACIAL_PORTRAIT":
                if calculate_iou(existing["boundingBox"], face["box"]) > 0.6:
                    is_duplicate = True
                    break
        if is_duplicate:
            continue

        region_id = f"reg_face_{idx + 1}"
        regions.append({
            "id": region_id,
            "type": "FACIAL_PORTRAIT",
            "boundingBox": face["box"],
            "confidence": face.get("confidence", 0.90),
            "attributes": face.get("attributes", {}),
            "adaptationStrategy": {
                "action": "SUPER_RESOLVE_AND_STABILIZE",
                "contrastBoost": 1.40,
                "edgeSharpen": True
            }
        })

    # 3. Add Text lines for Atkinson Hyperlegible Reflow
    for idx, text in enumerate(texts):
        # If text is heavily overlapping with a HUD element, allow HUD to claim it or keep text as reflowable
        region_id = f"reg_txt_{idx + 1}"
        regions.append({
            "id": region_id,
            "type": "TEXT_BLOCK",
            "boundingBox": text["box"],
            "confidence": text.get("confidence", 0.90),
            "textContent": text.get("text", ""),
            "adaptationStrategy": {
                "action": "DYNAMIC_REFLOW",
                "typography": {
                    "preferredFont": "Atkinson-Hyperlegible",
                    "fontSizeRem": 2.2,
                    "fontWeight": "800",
                    "highContrastTheme": user_contrast_theme
                }
            }
        })

    # 4. Default invariant background context
    regions.append({
        "id": "reg_bg_context",
        "type": "BACKGROUND_CONTEXT",
        "boundingBox": {"left": 0.0, "top": 0.0, "width": 1.0, "height": 1.0},
        "confidence": 1.0,
        "textContent": "Background Media Stream",
        "adaptationStrategy": {
            "action": "DESATURATE_AND_ATTENUATE",
            "opacity": 0.40
        }
    })

    return regions
