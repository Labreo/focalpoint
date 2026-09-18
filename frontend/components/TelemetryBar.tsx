'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Eye, 
  Activity, 
  Cloud, 
  Settings, 
  HelpCircle, 
  ShieldCheck, 
  Crosshair 
} from 'lucide-react';
import { KinematicState, PathologyType } from '../types';
import { animeTransitions } from '../lib/anime_transitions';

interface TelemetryBarProps {
  fps: number;
  gazeLatencyMs: number;
  awsLatencyMs: number;
  kinematicState: KinematicState;
  activePathology: PathologyType;
  onPathologyChange: (type: PathologyType) => void;
  simulatorActive: boolean;
  onToggleSimulator: () => void;
  onOpenHelp: () => void;
  isWebGazerActive?: boolean;
  onToggleWebGazer?: () => void;
  isAnalyzing?: boolean;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  fps,
  gazeLatencyMs,
  awsLatencyMs,
  kinematicState,
  activePathology,
  onPathologyChange,
  simulatorActive,
  onToggleSimulator,
  onOpenHelp,
  isWebGazerActive = false,
  onToggleWebGazer,
  isAnalyzing = false
}) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      animeTransitions.staggerEntrance('.telemetry-badge', 40);
    }
  }, []);

  return (
    <header ref={containerRef} className="sticky top-0 z-30 flex flex-col w-full bg-bg/95 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-bg-3">
        {/* Deltea Brand Header */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-highlight text-bg font-bold shadow-md shadow-amber-300/30 group-hover:scale-105 transition">
              <Eye className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-fg tracking-tight animate-flicker-in group-hover:underline">
                @focalpoint
              </h1>
              {/* Deltea signature spinning snapped pixel cross */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/icons/x.svg" 
                className="size-3.5 animate-spin-snapped" 
                alt="retro snapped cross icon" 
              />
            </div>
          </Link>

          <span className="hidden xl:inline text-muted font-telemetry text-xs">
            // gaze-driven semantic media adaptation \
          </span>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400 font-telemetry">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span>LIVE</span>
          </div>
        </div>

        {/* Real-time System Metrics */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-telemetry">
          {/* FPS Counter */}
          <div className="telemetry-badge flex items-center gap-1.5 rounded-md border border-bg-3 bg-bg-1 px-2.5 py-1 text-fg">
            <Activity className="h-3 w-3 text-cyan-highlight" />
            <span>{fps} FPS</span>
          </div>

          {/* Eye Kinematics State */}
          <div className={`telemetry-badge flex items-center gap-1.5 rounded-md px-2.5 py-1 font-bold ${
            kinematicState === 'FIXATION' 
              ? 'border border-amber-300/60 bg-amber-400/20 text-amber-highlight' 
              : 'border border-bg-3 bg-bg-1 text-cyan-highlight'
          }`}>
            <Crosshair className="h-3 w-3" />
            <span>{kinematicState} <span className="text-muted">\\</span> {gazeLatencyMs}ms</span>
          </div>

          {/* AWS Fan-Out Latency & Differential Ingestion Indicator */}
          <div className={`telemetry-badge flex items-center gap-1.5 rounded-md px-2.5 py-1 ${
            isAnalyzing
              ? 'border border-amber-400/60 bg-amber-400/20 text-amber-highlight animate-pulse'
              : 'border border-bg-3 bg-bg-1 text-fg'
          }`}>
            <Cloud className={`h-3 w-3 ${isAnalyzing ? 'animate-bounce text-amber-highlight' : 'text-amber-highlight'}`} />
            <span>{isAnalyzing ? 'AWS // FAN-OUT...' : `AWS: ${awsLatencyMs}ms`}</span>
          </div>

          {/* WebGazer Webcam Eye-Tracker Toggle */}
          {onToggleWebGazer && (
            <button
              onClick={onToggleWebGazer}
              className={`telemetry-badge flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition ${
                isWebGazerActive
                  ? 'border border-emerald-400/60 bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/30'
                  : 'border border-bg-3 bg-bg-1 text-muted hover:text-fg hover:border-fg'
              }`}
              title="Toggle WebGazer Webcam Eye Tracking"
              aria-pressed={isWebGazerActive}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isWebGazerActive ? 'bg-emerald-400 animate-ping' : 'bg-muted'}`} />
              <span>{isWebGazerActive ? 'WebGazer: ON' : 'WebGazer: OFF'}</span>
            </button>
          )}
        </div>

        {/* Pathology Selector & Controls */}
        <div className="flex items-center gap-2">
          {/* Pathology Selector Dropdown */}
          <div className="flex items-center gap-1.5 rounded-md border border-bg-3 bg-bg-1 px-2 py-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-highlight" />
            <select
              value={activePathology}
              onChange={(e) => onPathologyChange(e.target.value as PathologyType)}
              className="cursor-pointer bg-transparent font-telemetry text-xs font-bold text-fg focus:outline-none"
              aria-label="Select diagnosed ophthalmic condition"
            >
              <option value="AMD" className="bg-bg-1 text-fg">AMD // Central Scotoma</option>
              <option value="TUNNEL_VISION" className="bg-bg-1 text-fg">RP // Tunnel Vision</option>
              <option value="LOW_ACUITY" className="bg-bg-1 text-fg">DR // Low Acuity</option>
              <option value="HEMIANOPIA" className="bg-bg-1 text-fg">Hemianopia // Half-Field</option>
            </select>
          </div>

          {/* Simulator Toggle Button */}
          <button
            onClick={onToggleSimulator}
            className={`rounded-md px-2.5 py-1 font-telemetry text-xs font-bold transition ${
              simulatorActive
                ? 'bg-amber-highlight text-bg border border-amber-300 font-black'
                : 'border border-bg-3 bg-bg-1 text-fg hover:border-fg'
            }`}
            title="Toggle Caregiver / Evaluator Pathology Simulator (Hotkey: S)"
            aria-pressed={simulatorActive}
          >
            {simulatorActive ? 'SIMULATOR: ON' : 'SIMULATOR: OFF'}
          </button>

          {/* Calibration Page Link */}
          <Link
            href="/calibration"
            className="flex h-7 items-center gap-1 rounded-md border border-bg-3 bg-bg-1 px-2.5 font-telemetry text-xs font-bold text-fg transition hover:border-fg hover:underline"
            title="Run 9-Point Eye Calibration"
          >
            <Crosshair className="h-3 w-3 text-cyan-highlight" />
            <span className="hidden sm:inline">Calibrate</span>
          </Link>

          {/* Profile Settings Link */}
          <Link
            href="/profile"
            className="flex h-7 items-center gap-1 rounded-md border border-bg-3 bg-bg-1 px-2.5 font-telemetry text-xs font-bold text-fg transition hover:border-fg hover:underline"
            title="Ophthalmic Profile Settings"
          >
            <Settings className="h-3 w-3 text-amber-highlight" />
            <span className="hidden sm:inline">Profile</span>
          </Link>

          {/* Help Modal Trigger */}
          <button
            onClick={onOpenHelp}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-bg-3 bg-bg-1 text-muted transition hover:border-fg hover:text-fg"
            title="Keyboard Accessibility & Shortcut Guide (Hotkey: ?)"
            aria-label="Keyboard Shortcuts Guide"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Deltea Signature Spiky Sawtooth Divider */}
      <div className="spiky-divider" />
    </header>
  );
};
