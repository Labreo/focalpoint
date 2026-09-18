"""
AWS Polly Client Adapter for FocalPoint
Generates high-clarity neural text-to-speech audio for reflowed reading blocks.
Supports Joanna, Matthew, and neural assistive speech engines.
"""
import base64
import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

def synthesize_speech_mp3(
    polly_client: Any,
    text: str,
    voice_id: str = "Joanna",
    engine: str = "neural"
) -> Optional[str]:
    """
    Synthesizes speech using Amazon Polly and returns base64-encoded MP3 audio.
    """
    if not polly_client:
        logger.warning("Polly client not initialized.")
        return None

    try:
        response = polly_client.synthesize_speech(
            Text=text[:1500], # Clamp for latency
            OutputFormat="mp3",
            VoiceId=voice_id,
            Engine=engine
        )
        audio_stream = response.get("AudioStream")
        if audio_stream:
            audio_bytes = audio_stream.read()
            return base64.b64encode(audio_bytes).decode("utf-8")
    except Exception as exc:
        logger.error(f"Amazon Polly synthesis error: {exc}")

    return None
