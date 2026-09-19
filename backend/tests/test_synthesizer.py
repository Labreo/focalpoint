"""
Unit tests for Semantic Region Synthesizer in FocalPoint
"""
import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'handlers')))

from synthesizer import calculate_iou, merge_semantic_regions

class TestSynthesizer(unittest.TestCase):

    def test_calculate_iou_exact_match(self):
        box_a = {"left": 0.1, "top": 0.1, "width": 0.2, "height": 0.2}
        box_b = {"left": 0.1, "top": 0.1, "width": 0.2, "height": 0.2}
        iou = calculate_iou(box_a, box_b)
        self.assertAlmostEqual(iou, 1.0, places=4)

    def test_calculate_iou_disjoint(self):
        box_a = {"left": 0.0, "top": 0.0, "width": 0.1, "height": 0.1}
        box_b = {"left": 0.5, "top": 0.5, "width": 0.1, "height": 0.1}
        iou = calculate_iou(box_a, box_b)
        self.assertEqual(iou, 0.0)

    def test_merge_semantic_regions_assigns_strategies(self):
        texts = [
            {
                "type": "TEXT_BLOCK",
                "text": "LIVE BROADCAST",
                "confidence": 0.95,
                "box": {"left": 0.05, "top": 0.90, "width": 0.40, "height": 0.06}
            }
        ]
        faces = [
            {
                "type": "FACIAL_PORTRAIT",
                "confidence": 0.98,
                "box": {"left": 0.70, "top": 0.10, "width": 0.20, "height": 0.35},
                "attributes": {"mouthOpen": True}
            }
        ]
        huds = [
            {
                "type": "PERSISTENT_HUD",
                "description": "Cricket Match Scoreboard",
                "box": {"left": 0.05, "top": 0.05, "width": 0.30, "height": 0.10},
                "suggestedAnchor": "BOTTOM_RIGHT",
                "metrics": {"score": "287/4"}
            }
        ]

        regions = merge_semantic_regions(texts, faces, huds, user_contrast_theme="YELLOW_ON_BLACK")

        # HUD + Face + Text + Background = 4 regions
        self.assertEqual(len(regions), 4)

        # Check HUD region
        hud_reg = next(r for r in regions if r["type"] == "PERSISTENT_HUD")
        self.assertEqual(hud_reg["adaptationStrategy"]["action"], "PIN_TO_PERIPHERY")
        self.assertEqual(hud_reg["adaptationStrategy"]["anchorCorner"], "BOTTOM_RIGHT")

        # Check Face region
        face_reg = next(r for r in regions if r["type"] == "FACIAL_PORTRAIT")
        self.assertEqual(face_reg["adaptationStrategy"]["action"], "SUPER_RESOLVE_AND_STABILIZE")
        self.assertTrue(face_reg["adaptationStrategy"]["edgeSharpen"])

        # Check Text region
        text_reg = next(r for r in regions if r["type"] == "TEXT_BLOCK")
        self.assertEqual(text_reg["adaptationStrategy"]["action"], "DYNAMIC_REFLOW")
        self.assertEqual(text_reg["adaptationStrategy"]["typography"]["preferredFont"], "Atkinson-Hyperlegible")
        self.assertEqual(text_reg["adaptationStrategy"]["typography"]["highContrastTheme"], "YELLOW_ON_BLACK")

        # Check Background context
        bg_reg = next(r for r in regions if r["type"] == "BACKGROUND_CONTEXT")
        self.assertEqual(bg_reg["adaptationStrategy"]["action"], "DESATURATE_AND_ATTENUATE")

    def test_peripheral_hud_synthesis_when_bedrock_empty(self):
        """Tests that multiple text lines in the bottom peripheral zone synthesize into a unified PERSISTENT_HUD."""
        texts = [
            {"type": "TEXT_BLOCK", "text": "SPARTAN WARRIORS", "confidence": 0.98, "box": {"left": 0.01, "top": 0.88, "width": 0.18, "height": 0.03}},
            {"type": "TEXT_BLOCK", "text": "84/4 (10.0 Ov)", "confidence": 0.95, "box": {"left": 0.25, "top": 0.87, "width": 0.11, "height": 0.04}},
            {"type": "TEXT_BLOCK", "text": "NEED 66 RUNS IN 60 BALLS", "confidence": 0.92, "box": {"left": 0.26, "top": 0.95, "width": 0.20, "height": 0.03}},
            {"type": "TEXT_BLOCK", "text": "Top Match Header", "confidence": 0.90, "box": {"left": 0.10, "top": 0.40, "width": 0.30, "height": 0.05}}
        ]
        # Bedrock returns empty list
        huds = []
        faces = []

        regions = merge_semantic_regions(texts, faces, huds)
        hud_regions = [r for r in regions if r["type"] == "PERSISTENT_HUD"]
        self.assertEqual(len(hud_regions), 1)
        self.assertIn("SPARTAN WARRIORS", hud_regions[0]["textContent"])
        self.assertIn("84/4 (10.0 Ov)", hud_regions[0]["textContent"])
        self.assertIn("NEED 66 RUNS IN 60 BALLS", hud_regions[0]["textContent"])
        self.assertEqual(hud_regions[0]["adaptationStrategy"]["action"], "PIN_TO_PERIPHERY")

        # The non-peripheral text should remain as TEXT_BLOCK
        text_regions = [r for r in regions if r["type"] == "TEXT_BLOCK"]
        self.assertEqual(len(text_regions), 1)
        self.assertEqual(text_regions[0]["textContent"], "Top Match Header")

    def test_micro_face_suppression(self):
        """Tests that distant micro-faces (area < 0.0035 or dim < 0.03) are suppressed."""
        faces = [
            # Distant fielder in outfield (6px wide on 1080p)
            {"type": "FACIAL_PORTRAIT", "confidence": 0.95, "box": {"left": 0.62, "top": 0.45, "width": 0.0058, "height": 0.0132}},
            # Presenter / close-up player portrait
            {"type": "FACIAL_PORTRAIT", "confidence": 0.99, "box": {"left": 0.10, "top": 0.20, "width": 0.18, "height": 0.25}}
        ]
        regions = merge_semantic_regions([], faces, [])
        face_regions = [r for r in regions if r["type"] == "FACIAL_PORTRAIT"]
        # Only the close-up face should be kept
        self.assertEqual(len(face_regions), 1)
        self.assertEqual(face_regions[0]["boundingBox"]["width"], 0.18)

if __name__ == '__main__':
    unittest.main()

