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

if __name__ == '__main__':
    unittest.main()
