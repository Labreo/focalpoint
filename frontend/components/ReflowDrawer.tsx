'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SemanticRegion, ContrastPreset } from '../types';
import { Volume2, X, ZoomIn, ZoomOut, Palette, CheckCircle2 } from 'lucide-react';
import { audioHaptics } from '../lib/synthetic_audio';

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
      role="region"
      aria-label="Reflowed Text Reader"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-40 max-h-[85vh] overflow-y-auto border-t-2 border-amber-highlight bg-slate-950/95 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 md:p-8"
      style={{
        boxShadow: '0 -20px 50px rgba(0, 0, 0, 0.9)'
      }}
    >
      <div className="mx-auto max-w-5xl">
        {/* Top Control Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-amber-highlight">
              <span className="h-2 w-2 animate-ping rounded-full bg-amber-highlight" />
            </span>
            <h2 className="font-atkinson text-lg font-bold uppercase tracking-wider text-amber-highlight md:text-xl">
              Semantic Text Reflow — Atkinson Hyperlegible
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Read Aloud Button */}
            <button
              onClick={handleTTS}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-atkinson text-sm font-bold transition ${
                isSpeaking
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/40'
                  : isLoadingAudio
                  ? 'bg-amber-400/20 text-amber-highlight border border-amber-400/30'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              aria-label={isSpeaking ? 'Stop reading aloud' : 'Read reflowed text aloud'}
            >
              <Volume2 className={`h-5 w-5 ${isSpeaking ? 'animate-bounce' : isLoadingAudio ? 'animate-pulse' : ''}`} />
              <span>{isSpeaking ? 'Speaking...' : isLoadingAudio ? 'Synthesizing...' : 'Read Aloud'}</span>
            </button>

            {/* Font Scale Down */}
            <button
              onClick={() => onFontScaleChange(Math.max(1.0, fontScale - 0.25))}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Decrease text size"
            >
              <ZoomOut className="h-5 w-5" />
            </button>

            <span className="font-telemetry text-sm font-bold text-amber-highlight">
              {fontScale.toFixed(2)}x
            </span>

            {/* Font Scale Up */}
            <button
              onClick={() => onFontScaleChange(Math.min(3.0, fontScale + 0.25))}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Increase text size"
            >
              <ZoomIn className="h-5 w-5" />
            </button>

            {/* Contrast Preset Cycle */}
            <button
              onClick={() => {
                const presets: ContrastPreset[] = ['AMBER', 'CYAN', 'MINT', 'INVERT'];
                const nextIdx = (presets.indexOf(contrastPreset) + 1) % presets.length;
                onContrastChange(presets[nextIdx]);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20"
              title="Cycle Contrast Mode (Hotkey: C)"
              aria-label="Cycle Contrast Mode"
            >
              <Palette className="h-4 w-4 text-cyan-highlight" />
              <span>{contrastPreset}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="ml-2 flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/30 text-red-300 transition hover:bg-red-600 hover:text-white"
              aria-label="Dismiss reflow drawer (Hotkey: Escape)"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Reflowed Text Content */}
        <div className="py-2">
          <p
            className="font-atkinson font-extrabold leading-relaxed tracking-wide text-amber-highlight"
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
        <div className="mt-6 flex flex-wrap items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Confidence: {Math.round((region.confidence || 0.95) * 100)}%</span>
            <span className="mx-2">•</span>
            <span>Atkinson Hyperlegible Glyphs (Braille Institute)</span>
          </div>
          <div className="font-telemetry text-slate-400">
            Press <kbd className="rounded bg-white/10 px-1 py-0.5 text-white">ESC</kbd> to return to stream • <kbd className="rounded bg-white/10 px-1 py-0.5 text-white">T</kbd> for Speech
          </div>
        </div>
      </div>
    </div>
  );
};
