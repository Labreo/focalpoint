'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SemanticRegion, ContrastPreset } from '../types';
import { 
  Volume2, 
  VolumeX, 
  ZoomIn, 
  ZoomOut, 
  Sparkles, 
  Pin, 
  Eye, 
  Check, 
  Play, 
  Square, 
  Layers 
} from 'lucide-react';
import { audioHaptics } from '../lib/synthetic_audio';

interface AccessibleReaderPanelProps {
  activeRegion: SemanticRegion | null;
  contrastPreset: ContrastPreset;
  onContrastChange: (preset: ContrastPreset) => void;
  fontScale: number;
  onFontScaleChange: (scale: number) => void;
  pinnedRegions: SemanticRegion[];
  onUnpinHUD: (regionId: string) => void;
  onTriggerAwsAnalysis: () => void;
  isAnalyzing: boolean;
  awsLatencyMs?: number;
  autoSyncAWS?: boolean;
  onToggleAutoSyncAWS?: () => void;
  lastSyncReason?: string;
  lastDelta?: number;
}

export const AccessibleReaderPanel: React.FC<AccessibleReaderPanelProps> = ({
  activeRegion,
  contrastPreset,
  onContrastChange,
  fontScale,
  onFontScaleChange,
  pinnedRegions,
  onUnpinHUD,
  onTriggerAwsAnalysis,
  isAnalyzing,
  awsLatencyMs,
  autoSyncAWS = true,
  onToggleAutoSyncAWS,
  lastSyncReason = 'Standby',
  lastDelta = 0
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [activeVoice, setActiveVoice] = useState<'Ruth' | 'Matthew'>('Ruth');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Auto-speak if enabled and region changes
  useEffect(() => {
    if (activeRegion?.textContent && autoSpeak) {
      handleSpeak(activeRegion.textContent);
    }
    return () => stopAudio();
  }, [activeRegion?.id]);

  const handleSpeak = async (textToSpeak?: string) => {
    const text = textToSpeak || activeRegion?.textContent;
    if (!text) return;

    if (isSpeaking) {
      stopAudio();
      return;
    }

    setIsSpeaking(true);

    try {
      // 1. Call AWS Polly via Next.js API or direct AWS Gateway
      const awsUrl = (process.env.NEXT_PUBLIC_AWS_API_URL || '').replace(/\/+$/, '');
      const endpoint = awsUrl ? `${awsUrl}/api/v1/synthesize-speech` : '/api/speech';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: activeVoice })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
          audioRef.current = audio;
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => {
            fallbackSpeech(text);
          };
          await audio.play();
          return;
        }
      }
    } catch {
      // Fallback
    }

    fallbackSpeech(text);
  };

  const fallbackSpeech = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  // Theme color styles
  const getThemeStyles = () => {
    switch (contrastPreset) {
      case 'AMBER':
        return {
          cardBg: 'bg-black border-amber-400/80',
          text: 'text-amber-300',
          accent: 'bg-amber-400 text-black',
          badge: 'border-amber-400 text-amber-300'
        };
      case 'CYAN':
        return {
          cardBg: 'bg-black border-cyan-400/80',
          text: 'text-cyan-300',
          accent: 'bg-cyan-400 text-black',
          badge: 'border-cyan-400 text-cyan-300'
        };
      case 'MINT':
        return {
          cardBg: 'bg-black border-emerald-400/80',
          text: 'text-emerald-300',
          accent: 'bg-emerald-400 text-black',
          badge: 'border-emerald-400 text-emerald-300'
        };
      case 'INVERT':
      default:
        return {
          cardBg: 'bg-black border-white',
          text: 'text-white',
          accent: 'bg-white text-black',
          badge: 'border-white text-white'
        };
    }
  };

  const theme = getThemeStyles();

  return (
    <aside className="flex h-full flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-md">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-amber-400">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-amber-400" />
            </span>
            <h2 className="font-sans text-sm font-bold uppercase tracking-wider text-slate-200">
              Accessible Gaze Reader
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">
              WCAG 2.2 AAA
            </span>
          </div>
        </div>

        {/* Font Size & Contrast Quick Controls */}
        <div className="my-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          {/* Font Scale */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onFontScaleChange(Math.max(0.9, fontScale - 0.2))}
              className="rounded bg-slate-800 px-2 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
              title="Decrease text size"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[48px] text-center font-mono text-xs text-slate-300">
              {Math.round(fontScale * 100)}%
            </span>
            <button
              onClick={() => onFontScaleChange(Math.min(2.5, fontScale + 0.2))}
              className="rounded bg-slate-800 px-2 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
              title="Increase text size"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Contrast Themes */}
          <div className="flex items-center gap-1">
            {(['AMBER', 'INVERT', 'CYAN', 'MINT'] as ContrastPreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => onContrastChange(preset)}
                className={`h-5 w-5 rounded-full border transition ${
                  contrastPreset === preset ? 'ring-2 ring-amber-400 scale-110' : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  backgroundColor:
                    preset === 'AMBER' ? '#FDE047' :
                    preset === 'CYAN' ? '#38BDF8' :
                    preset === 'MINT' ? '#34D399' : '#FFFFFF'
                }}
                title={`Select ${preset} palette`}
              />
            ))}
          </div>
        </div>

        {/* Active Inspection Card */}
        {activeRegion ? (
          <div className={`rounded-xl border-2 p-4 transition-all duration-200 ${theme.cardBg} shadow-xl`}>
            <div className="mb-2 flex items-center justify-between">
              <span className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider ${theme.accent}`}>
                {activeRegion.type === 'PERSISTENT_HUD' ? 'LIVE SCOREBOARD' : activeRegion.type.replace('_', ' ')}
              </span>

              {activeRegion.confidence && (
                <span className="font-mono text-[10px] text-slate-400">
                  OCR: {(activeRegion.confidence * 100).toFixed(1)}%
                </span>
              )}
            </div>

            {/* Atkinson Hyperlegible Reflowed Text */}
            <div
              className={`font-atkinson font-bold leading-relaxed tracking-wide ${theme.text}`}
              style={{ fontSize: `${fontScale * 1.3}rem` }}
            >
              {activeRegion.textContent}
            </div>

            {/* Read Aloud Button */}
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
              <button
                onClick={() => handleSpeak()}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition shadow-md ${
                  isSpeaking
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : `${theme.accent} hover:opacity-90`
                }`}
              >
                {isSpeaking ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>Stop Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" />
                    <span>Listen Aloud (AWS Polly)</span>
                  </>
                )}
              </button>

              {/* Live Soundwave Animation */}
              {isSpeaking && (
                <div className="flex items-center gap-1">
                  <span className="h-4 w-1 animate-pulse bg-amber-400 rounded-full" />
                  <span className="h-6 w-1 animate-pulse bg-amber-400 rounded-full [animation-delay:150ms]" />
                  <span className="h-3 w-1 animate-pulse bg-amber-400 rounded-full [animation-delay:300ms]" />
                  <span className="h-5 w-1 animate-pulse bg-amber-400 rounded-full [animation-delay:450ms]" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-center text-slate-400">
            <Eye className="mx-auto h-8 w-8 text-slate-500 mb-2 opacity-80" />
            <p className="font-atkinson text-sm font-semibold text-slate-300">
              Fixate gaze over any text in the video
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Look at the scoreboard, slide bullets, or news ticker for 250ms (or hover with mouse) to inspect and hear it read aloud.
            </p>
          </div>
        )}

        {/* Pinned Peripheral Scoreboard Widget */}
        {pinnedRegions.length > 0 && (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400">
                <Pin className="h-3 w-3" />
                <span>PINNED PERIPHERAL HUD</span>
              </span>
              <span className="text-[10px] text-slate-400">Docked to vision</span>
            </div>

            {pinnedRegions.map((region) => (
              <div key={region.id} className="flex items-center justify-between rounded bg-black/60 p-2 text-xs">
                <span className="font-atkinson font-bold text-emerald-300">
                  {region.textContent}
                </span>
                <button
                  onClick={() => onUnpinHUD(region.id)}
                  className="text-slate-400 hover:text-white text-[10px] ml-2"
                  title="Unpin"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action: Deep AWS Vision Trigger */}
      <div className="mt-4 border-t border-slate-800 pt-3">
        {/* Autonomous Edge Engine Telemetry */}
        <div className="mb-2 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${autoSyncAWS ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="font-mono text-[11px] text-slate-300">Edge Δ Engine</span>
            <span className="font-mono text-[10px] text-amber-400">
              Δ: {((lastDelta || 0) * 100).toFixed(1)}%
            </span>
          </div>
          {onToggleAutoSyncAWS && (
            <button
              onClick={onToggleAutoSyncAWS}
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold transition ${
                autoSyncAWS 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-slate-800 text-slate-400'
              }`}
              title="Toggle Autonomous AWS Differential Ingestion"
            >
              {autoSyncAWS ? 'AUTO: ON' : 'AUTO: OFF'}
            </button>
          )}
        </div>

        <button
          onClick={onTriggerAwsAnalysis}
          disabled={isAnalyzing}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 py-2.5 px-3 font-sans text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>{isAnalyzing ? 'Analyzing Frame with AWS...' : 'Run Deep AWS Vision Analysis'}</span>
        </button>

        <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-slate-500">
          <span className="truncate max-w-[170px]" title={lastSyncReason}>Sync: {lastSyncReason}</span>
          <span>AWS: {awsLatencyMs || 220}ms</span>
        </div>
      </div>
    </aside>
  );
};
