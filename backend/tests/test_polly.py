"""
Unit tests for Amazon Polly speech synthesis client in FocalPoint
"""
import unittest
from unittest.mock import MagicMock
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'handlers')))

from polly_client import synthesize_speech_mp3

class TestPollyClient(unittest.TestCase):

    def test_synthesize_speech_returns_base64_audio(self):
        mock_polly = MagicMock()
        mock_stream = MagicMock()
        mock_stream.read.return_value = b"ID3_FAKE_MP3_DATA"
        mock_polly.synthesize_speech.return_value = {"AudioStream": mock_stream}

        b64 = synthesize_speech_mp3(mock_polly, "Breaking News: High Speed Rail approved.", "Joanna")
        self.assertIsNotNone(b64)
        self.assertIsInstance(b64, str)
        mock_polly.synthesize_speech.assert_called_once_with(
            Text="Breaking News: High Speed Rail approved.",
            OutputFormat="mp3",
            VoiceId="Joanna",
            Engine="neural"
        )

    def test_handles_null_client_gracefully(self):
        res = synthesize_speech_mp3(None, "Hello world")
        self.assertNull = self.assertIsNone(res)

if __name__ == '__main__':
    unittest.main()
