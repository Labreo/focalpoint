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
  Layers,
  User,
  Crosshair,
  Maximize2,
  Activity
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
  allRegions?: SemanticRegion[];
  onSelectRegion?: (region: SemanticRegion) => void;
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
  lastDelta = 0,
  allRegions = [],
  onSelectRegion
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
    <aside className="flex h-full flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 shadow-2xl backdrop-blur-xl">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 items-center justify-center rounded-full bg-amber-400">
              <span className="h-1 w-1 animate-ping rounded-full bg-amber-400" />
            </span>
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Accessible Gaze Reader
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
              WCAG AAA
            </span>
          </div>
        </div>

        {/* Font Size & Contrast Controls */}
        <div className="my-3 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          {/* Font Scale Pill */}
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950/80 p-0.5">
            <button
              onClick={() => onFontScaleChange(Math.max(0.9, fontScale - 0.2))}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
              title="Decrease text size"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[44px] text-center font-mono text-[11px] font-semibold text-zinc-300">
              {Math.round(fontScale * 100)}%
            </span>
            <button
              onClick={() => onFontScaleChange(Math.min(2.5, fontScale + 0.2))}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
              title="Increase text size"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Contrast Theme Rings */}
          <div className="flex items-center gap-1.5">
            {(['AMBER', 'INVERT', 'CYAN', 'MINT'] as ContrastPreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => onContrastChange(preset)}
                className={`h-4 w-4 rounded-full border transition-all ${
                  contrastPreset === preset ? 'ring-2 ring-amber-400/80 ring-offset-2 ring-offset-zinc-950 scale-110' : 'opacity-50 hover:opacity-100'
                }`}
                style={{
                  backgroundColor:
                    preset === 'AMBER' ? '#FDE047' :
                    preset === 'CYAN' ? '#38BDF8' :
                    preset === 'MINT' ? '#34D399' : '#FFFFFF',
                  borderColor: 'rgba(255,255,255,0.2)'
                }}
                title={`Select ${preset} color palette`}
              />
            ))}
          </div>
        </div>

        {/* Active Inspection & Foveated Lens Card */}
        {activeRegion ? (
          <div className={`rounded-xl border p-4 transition-all duration-200 ${theme.cardBg} shadow-lg space-y-3`}>
            {/* Header: Component Type + Optical Zoom Factor */}
            <div className="flex items-center justify-between">
              <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${theme.accent}`}>
                {activeRegion.type === 'ACTION_ZONE' 
                  ? '🏏 ACTION ZONE' 
                  : activeRegion.type === 'PERSISTENT_HUD' 
                    ? '📊 SCOREBOARD' 
                    : activeRegion.type === 'FACIAL_PORTRAIT' 
                      ? '👤 FACE PORTRAIT' 
                      : activeRegion.type === 'INFOGRAPHIC' 
                        ? '📐 DIAGRAM' 
                        : activeRegion.type.replace('_', ' ')}
              </span>

              <span className="flex items-center gap-1 font-mono text-[10px] text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>{(activeRegion.zoomLevel || (activeRegion.type === 'ACTION_ZONE' ? 2.6 : 2.2)).toFixed(1)}x ZOOM</span>
              </span>
            </div>

            {/* Entity Label / Title */}
            {activeRegion.label && (
              <div className="font-mono text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Crosshair className="h-3.5 w-3.5 text-amber-400" />
                <span>{activeRegion.label}</span>
              </div>
            )}

            {/* Description / Reflowed Content */}
            <div
              className={`font-atkinson font-semibold leading-relaxed tracking-wide ${theme.text}`}
              style={{ fontSize: `${Math.min(1.4, fontScale * 1.15)}rem` }}
            >
              {activeRegion.textContent}
            </div>

            {/* Component Separation Status */}
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/80">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Assistive Spotlight Active</span>
              </span>
              <span>70% Background Dimmed</span>
            </div>

            {/* Read Aloud Button */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
              <button
                onClick={() => handleSpeak()}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-sm ${
                  isSpeaking
                    ? 'bg-rose-500 text-white hover:bg-rose-600'
                    : `${theme.accent} hover:opacity-90`
                }`}
              >
                {isSpeaking ? (
                  <>
                    <Square className="h-3 w-3 fill-current" />
                    <span>Stop Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Describe Audio (AWS Polly)</span>
                  </>
                )}
              </button>

              {/* Live Soundwave Animation */}
              {isSpeaking && (
                <div className="flex items-center gap-1">
                  <span className="h-3 w-0.5 animate-pulse bg-amber-400 rounded-full" />
                  <span className="h-5 w-0.5 animate-pulse bg-amber-400 rounded-full [animation-delay:150ms]" />
                  <span className="h-2.5 w-0.5 animate-pulse bg-amber-400 rounded-full [animation-delay:300ms]" />
                  <span className="h-4 w-0.5 animate-pulse bg-amber-400 rounded-full [animation-delay:450ms]" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-5 text-center text-zinc-400 space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="font-sans text-xs font-semibold text-zinc-200">
                Foveated Assistive Vision Lens Active
              </p>
              <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed">
                Hover or dwell gaze on any player or scoreboard to optically zoom 2.6x and separate background clutter.
              </p>
            </div>

            {/* Quick Demo Target Chips */}
            {allRegions && allRegions.length > 0 && onSelectRegion && (
              <div className="pt-2 border-t border-zinc-800/80">
                <span className="text-[10px] font-mono text-zinc-500 block mb-2">QUICK DEMO TARGETS</span>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {allRegions.slice(0, 4).map((region) => (
                    <button
                      key={region.id}
                      onClick={() => onSelectRegion(region)}
                      className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] font-mono font-medium text-zinc-300 hover:border-amber-400/60 hover:bg-zinc-800 hover:text-amber-300 transition shadow-sm"
                    >
                      {region.label || region.textContent?.slice(0, 18) || region.type}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pinned Peripheral Scoreboard Widget */}
        {pinnedRegions.length > 0 && (
          <div className="mt-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-emerald-400">
                <Pin className="h-3 w-3" />
                <span>PINNED HUD WIDGET</span>
              </span>
              <span className="text-[10px] text-zinc-500">Docked</span>
            </div>

            {pinnedRegions.map((region) => (
              <div key={region.id} className="flex items-center justify-between rounded-lg bg-zinc-950/80 p-2 text-xs border border-emerald-500/20">
                <span className="font-atkinson font-semibold text-emerald-300">
                  {region.textContent}
                </span>
                <button
                  onClick={() => onUnpinHUD(region.id)}
                  className="text-zinc-500 hover:text-zinc-200 text-xs ml-2 px-1"
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
      <div className="mt-4 border-t border-zinc-800/80 pt-3">
        {/* Autonomous Edge Engine Telemetry */}
        <div className="mb-2 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-2.5 py-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${autoSyncAWS ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="font-mono text-[11px] text-zinc-300">Edge Δ Engine</span>
            <span className="font-mono text-[10px] text-amber-400">
              Δ {((lastDelta || 0) * 100).toFixed(1)}%
            </span>
          </div>
          {onToggleAutoSyncAWS && (
            <button
              onClick={onToggleAutoSyncAWS}
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold transition ${
                autoSyncAWS 
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-zinc-800 text-zinc-400'
              }`}
              title="Toggle Autonomous AWS Differential Ingestion"
            >
              {autoSyncAWS ? 'AUTO' : 'MANUAL'}
            </button>
          )}
        </div>

        <button
          onClick={onTriggerAwsAnalysis}
          disabled={isAnalyzing}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700/60 bg-zinc-800/90 py-2 px-3 font-sans text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition disabled:opacity-50 shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>{isAnalyzing ? 'Analyzing Frame with AWS...' : 'Run Deep AWS Vision Analysis'}</span>
        </button>

        <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-zinc-500">
          <span className="truncate max-w-[170px]" title={lastSyncReason}>Sync: {lastSyncReason}</span>
          <span>AWS: {awsLatencyMs || 220}ms</span>
        </div>
      </div>
    </aside>
  );
};
