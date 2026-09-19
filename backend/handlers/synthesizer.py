"""
Semantic Region Synthesizer for FocalPoint
Merges multimodal inference streams (Rekognition Text, Rekognition Faces, Bedrock HUDs),
resolves spatial overlaps via Intersection-over-Union (IoU), aggregates fragmented text
into coherent semantic clusters and peripheral HUDs, and assigns ophthalmic adaptation strategies.
"""
from typing import Any, Dict, List
import uuid

# Filtering Thresholds
MIN_FACE_AREA = 0.0035    # Normalized area: width * height must be >= 0.35% of screen
MIN_FACE_DIM = 0.03       # Width and height must each be >= 3% of screen
PERIPHERAL_BOTTOM_THRESHOLD = 0.76  # Lower 24% of screen for scoreboards / chyrons
PERIPHERAL_TOP_THRESHOLD = 0.15     # Top 15% of screen for banners / header HUDs

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

def compute_bounding_box_union(boxes: List[Dict[str, float]]) -> Dict[str, float]:
    """Computes the minimal bounding box enclosing all input boxes."""
    if not boxes:
        return {"left": 0.0, "top": 0.0, "width": 0.0, "height": 0.0}
    min_x = min(b["left"] for b in boxes)
    min_y = min(b["top"] for b in boxes)
    max_x = max(b["left"] + b["width"] for b in boxes)
    max_y = max(b["top"] + b["height"] for b in boxes)
    return {
        "left": round(max(0.0, min_x), 4),
        "top": round(max(0.0, min_y), 4),
        "width": round(min(1.0 - min_x, max_x - min_x), 4),
        "height": round(min(1.0 - min_y, max_y - min_y), 4)
    }

def synthesize_peripheral_hud(text_items: List[Dict[str, Any]], anchor: str = "BOTTOM_RIGHT") -> Dict[str, Any]:
    """
    Combines fragmented text detections located within a peripheral zone (e.g. scoreboard or news ticker)
    into a single cohesive PERSISTENT_HUD entity.
    """
    # Sort items top-to-bottom, then left-to-right
    sorted_items = sorted(text_items, key=lambda t: (round(t["box"]["top"] / 0.035), t["box"]["left"]))
    
    # Filter out single-character detached artifacts (e.g. isolated '0', 'o', '1')
    meaningful_texts = []
    for item in sorted_items:
        txt = item.get("text", "").strip()
        if len(txt) > 1:
            meaningful_texts.append(txt)
            
    combined_text = " | ".join(meaningful_texts) if meaningful_texts else "Peripheral HUD"
    boxes = [item["box"] for item in sorted_items]
    enclosing_box = compute_bounding_box_union(boxes)
    
    return {
        "box": enclosing_box,
        "description": combined_text,
        "suggestedAnchor": anchor,
        "metrics": {"source": "rekognition_spatial_clustering", "tokenCount": len(sorted_items)}
    }

def cluster_adjacent_texts(texts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Clusters adjacent non-peripheral text lines into consolidated text blocks.
    Merges lines if vertical gap <= 0.025 and horizontal proximity is detected.
    """
    if not texts:
        return []
        
    valid_texts = [
        t for t in texts
        if len(t.get("text", "").strip()) > 1 or t.get("text", "").strip().isalnum()
    ]
    
    sorted_texts = sorted(valid_texts, key=lambda t: (t["box"]["top"], t["box"]["left"]))
    clusters: List[List[Dict[str, Any]]] = []
    
    for t in sorted_texts:
        box = t["box"]
        merged = False
        for c in clusters:
            last_box = c[-1]["box"]
            vertical_gap = box["top"] - (last_box["top"] + last_box["height"])
            horizontal_overlap = not (box["left"] > last_box["left"] + last_box["width"] + 0.08 or 
                                     box["left"] + box["width"] < last_box["left"] - 0.08)
            if 0.0 <= vertical_gap <= 0.025 and horizontal_overlap:
                c.append(t)
                merged = True
                break
        if not merged:
            clusters.append([t])
            
    result = []
    for c in clusters:
        if len(c) == 1:
            result.append(c[0])
        else:
            combined_text = " ".join(item.get("text", "").strip() for item in c)
            boxes = [item["box"] for item in c]
            result.append({
                "type": "TEXT_BLOCK",
                "text": combined_text,
                "confidence": min(item.get("confidence", 0.9) for item in c),
                "box": compute_bounding_box_union(boxes)
            })
    return result

def merge_semantic_regions(
    texts: List[Dict[str, Any]],
    faces: List[Dict[str, Any]],
    huds: List[Dict[str, Any]],
    user_contrast_theme: str = "YELLOW_ON_BLACK"
) -> List[Dict[str, Any]]:
    """
    Synthesizes discrete entity lists into a unified SemanticRegion list.
    Prioritizes HUDs, filters out distant micro-faces, clusters fragmented text,
    and assigns ophthalmic adaptation strategies.
    """
    regions: List[Dict[str, Any]] = []

    # If Bedrock provided no HUDs, detect and cluster peripheral text into HUDs
    effective_huds = list(huds) if huds else []
    remaining_texts = list(texts)

    if not effective_huds and remaining_texts:
        # Check for bottom peripheral cluster (scoreboards, broadcast chyrons)
        bottom_texts = [
            t for t in remaining_texts
            if t["box"]["top"] >= PERIPHERAL_BOTTOM_THRESHOLD
        ]
        if len(bottom_texts) >= 2:
            hud_obj = synthesize_peripheral_hud(bottom_texts, anchor="BOTTOM_RIGHT")
            effective_huds.append(hud_obj)
            # Remove consumed texts
            remaining_texts = [t for t in remaining_texts if t not in bottom_texts]

        # Check for top peripheral cluster (headers, banners)
        top_texts = [
            t for t in remaining_texts
            if t["box"]["top"] + t["box"]["height"] <= PERIPHERAL_TOP_THRESHOLD
        ]
        if len(top_texts) >= 3:
            hud_obj = synthesize_peripheral_hud(top_texts, anchor="TOP_RIGHT")
            effective_huds.append(hud_obj)
            remaining_texts = [t for t in remaining_texts if t not in top_texts]

    # 1. Add HUD / Scoreboard elements (highest persistence priority)
    for idx, hud in enumerate(effective_huds):
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

    # 2. Add Faces for lip-reading (strictly filter out distant background micro-faces)
    valid_faces = []
    for face in faces:
        box = face.get("box", {})
        w = box.get("width", 0.0)
        h = box.get("height", 0.0)
        area = w * h
        # Suppress micro-faces (outfield fielders, distant audience specs)
        if area >= MIN_FACE_AREA and w >= MIN_FACE_DIM and h >= MIN_FACE_DIM:
            valid_faces.append(face)

    for idx, face in enumerate(valid_faces):
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

    # 3. Add clustered Text lines for Atkinson Hyperlegible Reflow
    clustered_texts = cluster_adjacent_texts(remaining_texts)
    for idx, text in enumerate(clustered_texts):
        clean_text = text.get("text", "").strip()
        if not clean_text or (len(clean_text) <= 1 and not clean_text.isalnum()):
            continue

        region_id = f"reg_txt_{idx + 1}"
        regions.append({
            "id": region_id,
            "type": "TEXT_BLOCK",
            "boundingBox": text["box"],
            "confidence": text.get("confidence", 0.90),
            "textContent": clean_text,
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

