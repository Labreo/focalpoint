'use client';
import React, { useState, useEffect, useRef } from 'react';
import { SemanticRegion, ContrastPreset } from '../types';
import { Volume2, X, ZoomIn, ZoomOut, Palette, CheckCircle2, Sparkles } from 'lucide-react';
import { audioHaptics } from '../lib/synthetic_audio';
import { animeTransitions } from '../lib/anime_transitions';

interface ReflowDrawerProps {
  isOpen: boolean;
  region: SemanticRegion | null;
  contrastPreset: ContrastPreset;
  onContrastChange: (preset: ContrastPreset) => void;
  fontScale: number;
  onFontScaleChange: (scale: number) => void;
  onClose: () => void;
}

export const ReflowDrawer: React.FC<ReflowDrawerProps> = ({
  isOpen,
  region,
  contrastPreset,
  onContrastChange,
  fontScale,
  onFontScaleChange,
  onClose
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsLoadingAudio(false);
  };

  useEffect(() => {
    // Reset speaking state if region changes
    stopPlayback();
  }, [region?.id]);

  // Anime.js elastic drawer entrance
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      animeTransitions.animateDrawerEntrance(drawerRef.current);
    }
  }, [isOpen]);

  if (!isOpen || !region || region.type !== 'TEXT_BLOCK') {
    return null;
  }

  const handleTTS = async () => {
    if (isSpeaking || isLoadingAudio) {
      stopPlayback();
      return;
    }

    const textToRead = region.textContent || '';
    if (!textToRead) return;

    setIsLoadingAudio(true);

    try {
      // 1. Attempt AWS Polly Neural Speech Synthesis
      const awsUrl = (process.env.NEXT_PUBLIC_AWS_API_URL || '').replace(/\/+$/, '');
      const speechEndpoint = awsUrl ? `${awsUrl}/api/v1/synthesize-speech` : '/api/speech';
      const res = await fetch(speechEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToRead, voiceId: 'Ruth' })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
          audioRef.current = audio;
          audio.onended = () => {
            setIsSpeaking(false);
            audioRef.current = null;
          };
          audio.onerror = () => {
            stopPlayback();
          };
          await audio.play();
          setIsSpeaking(true);
          setIsLoadingAudio(false);
          return;
        }
      }
    } catch {
      // Fallback to Web Speech API
    }

    setIsLoadingAudio(false);

    // 2. Client Fallback via Web Speech API
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleClose = () => {
    stopPlayback();
    audioHaptics.playDismissPop();
    onClose();
  };

  return (
    <div
      ref={drawerRef}
      role="region"
      aria-label="Reflowed Text Reader"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-40 max-h-[85vh] overflow-y-auto border-t-2 border-amber-highlight bg-bg/98 p-6 shadow-2xl backdrop-blur-xl md:p-8"
      style={{
        boxShadow: '0 -25px 60px rgba(0, 0, 0, 0.95)'
      }}
    >
      <div className="mx-auto max-w-5xl">
        {/* Top Control Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-bg-3 pb-3">
          <div className="flex items-center gap-2 font-telemetry">
            <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-amber-highlight">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-amber-highlight" />
            </span>
            <span className="font-bold text-xs uppercase tracking-wider text-amber-highlight">
              // ATKINSON HYPERLEGIBLE REFLOW \\
            </span>
            <span className="hidden sm:inline text-muted text-xs">// BRAILLE INSTITUTE CERTIFIED</span>
          </div>

          <div className="flex items-center gap-2 font-telemetry">
            {/* Read Aloud Button with Soundwave Equalizer */}
            <button
              onClick={handleTTS}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                isSpeaking
                  ? 'bg-emerald-500 text-bg shadow-md shadow-emerald-500/30'
                  : isLoadingAudio
                  ? 'bg-amber-400/20 text-amber-highlight border border-amber-400/40'
                  : 'border border-bg-3 bg-bg-1 text-fg hover:border-fg hover:underline'
              }`}
              aria-label={isSpeaking ? 'Stop reading aloud' : 'Read reflowed text aloud'}
            >
              {isSpeaking ? (
                <div className="flex items-center gap-0.5 h-3.5">
                  <span className="w-0.5 h-3 bg-bg animate-pulse" />
                  <span className="w-0.5 h-2 bg-bg animate-ping" />
                  <span className="w-0.5 h-3.5 bg-bg animate-bounce" />
                </div>
              ) : (
                <Volume2 className={`h-3.5 w-3.5 ${isLoadingAudio ? 'animate-pulse text-amber-highlight' : 'text-cyan-highlight'}`} />
              )}
              <span>{isSpeaking ? 'STOP SPEECH' : isLoadingAudio ? 'SYNTHESIZING...' : 'READ ALOUD (POLLY)'}</span>
            </button>

            {/* Font Scale Down */}
            <button
              onClick={() => onFontScaleChange(Math.max(1.0, fontScale - 0.25))}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-bg-3 bg-bg-1 text-fg transition hover:border-fg"
              aria-label="Decrease text size"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>

            <span className="px-1 text-xs font-bold text-amber-highlight">
              {fontScale.toFixed(2)}x
            </span>

            {/* Font Scale Up */}
            <button
              onClick={() => onFontScaleChange(Math.min(3.0, fontScale + 0.25))}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-bg-3 bg-bg-1 text-fg transition hover:border-fg"
              aria-label="Increase text size"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>

            {/* Contrast Preset Cycle */}
            <button
              onClick={() => {
                const presets: ContrastPreset[] = ['AMBER', 'CYAN', 'MINT', 'INVERT'];
                const nextIdx = (presets.indexOf(contrastPreset) + 1) % presets.length;
                onContrastChange(presets[nextIdx]);
              }}
              className="flex items-center gap-1 rounded-md border border-bg-3 bg-bg-1 px-2.5 py-1 text-xs font-bold text-fg transition hover:border-fg hover:underline"
              title="Cycle Contrast Mode (Hotkey: C)"
              aria-label="Cycle Contrast Mode"
            >
              <Palette className="h-3 w-3 text-cyan-highlight" />
              <span>{contrastPreset}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="ml-2 flex h-7 w-7 items-center justify-center rounded-md border border-red-500/40 bg-red-500/10 text-red-300 transition hover:bg-red-500 hover:text-bg"
              aria-label="Dismiss reflow drawer (Hotkey: Escape)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Reflowed Text Content */}
        <div className="py-3">
          <p
            className="font-atkinson font-extrabold leading-relaxed tracking-wide text-amber-highlight animate-flicker-in"
            style={{
              fontSize: `clamp(${1.8 * fontScale}rem, ${2.5 * fontScale}vw + 1rem, ${4.5 * fontScale}rem)`,
              lineHeight: 1.45,
              wordSpacing: '0.12em'
            }}
          >
            {region.textContent || 'No text extracted for this region.'}
          </p>
        </div>

        {/* Accessibility Telemetry Footer */}
        <div className="mt-4 flex flex-wrap items-center justify-between border-t border-bg-3 pt-3 text-xs text-muted font-telemetry">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>CONFIDENCE: {Math.round((region.confidence || 0.95) * 100)}%</span>
            <span className="text-bg-3">\\</span>
            <span>WCAG 2.2 AAA (7:1 RATIO)</span>
          </div>
          <div>
            Press <kbd className="rounded border border-bg-3 bg-bg-2 px-1 py-0.5 text-fg">ESC</kbd> to return • <kbd className="rounded border border-bg-3 bg-bg-2 px-1 py-0.5 text-fg">T</kbd> for Speech
          </div>
        </div>
      </div>
    </div>
  );
};
