'use client';

import React from 'react';
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
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/90 px-4 py-2.5 backdrop-blur-md">
      {/* Brand & Live Indicator */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-highlight text-slate-950 shadow-md shadow-amber-300/40">
            <Eye className="h-5 w-5" />
          </div>
          <span className="font-atkinson text-lg font-black tracking-tight text-white">
            FOCAL<span className="text-amber-highlight">POINT</span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span>LIVE</span>
        </div>
      </div>

      {/* Real-time System Metrics */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-telemetry">
        {/* FPS Counter */}
        <div className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-slate-300">
          <Activity className="h-3.5 w-3.5 text-cyan-highlight" />
          <span>{fps} FPS</span>
        </div>

        {/* Eye Kinematics State */}
        <div className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold ${
          kinematicState === 'FIXATION' 
            ? 'border border-amber-300/40 bg-amber-400/20 text-amber-highlight' 
            : 'border border-cyan-400/30 bg-cyan-500/10 text-cyan-highlight'
        }`}>
          <Crosshair className="h-3.5 w-3.5" />
          <span>{kinematicState} ({gazeLatencyMs}ms)</span>
        </div>

        {/* AWS Fan-Out Latency & Differential Ingestion Indicator */}
        <div className={`flex items-center gap-1 rounded-lg px-2.5 py-1 ${
          isAnalyzing
            ? 'border border-amber-400/40 bg-amber-400/20 text-amber-highlight animate-pulse'
            : 'bg-white/5 text-slate-300'
        }`}>
          <Cloud className={`h-3.5 w-3.5 ${isAnalyzing ? 'animate-bounce text-amber-highlight' : 'text-amber-highlight'}`} />
          <span>{isAnalyzing ? 'AWS: Fan-Out...' : `AWS: ${awsLatencyMs}ms`}</span>
        </div>

        {/* WebGazer Webcam Eye-Tracker Toggle */}
        {onToggleWebGazer && (
          <button
            onClick={onToggleWebGazer}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-atkinson text-xs font-bold transition ${
              isWebGazerActive
                ? 'border border-emerald-400/50 bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/30'
                : 'border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Toggle WebGazer Webcam Eye Tracking"
            aria-pressed={isWebGazerActive}
          >
            <span className={`h-2 w-2 rounded-full ${isWebGazerActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span>{isWebGazerActive ? 'WebGazer: ACTIVE' : 'WebGazer: OFF'}</span>
          </button>
        )}
      </div>

      {/* Pathology Selector & Controls */}
      <div className="flex items-center gap-2">
        {/* Pathology Selector Dropdown */}
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900 px-2 py-1">
          <ShieldCheck className="h-4 w-4 text-amber-highlight" />
          <select
            value={activePathology}
            onChange={(e) => onPathologyChange(e.target.value as PathologyType)}
            className="cursor-pointer bg-transparent font-atkinson text-xs font-bold text-white focus:outline-none"
            aria-label="Select diagnosed ophthalmic condition"
          >
            <option value="AMD" className="bg-slate-900 text-white">AMD (Central Scotoma / PRL)</option>
            <option value="TUNNEL_VISION" className="bg-slate-900 text-white">Retinitis Pigmentosa (Tunnel Vision)</option>
            <option value="LOW_ACUITY" className="bg-slate-900 text-white">Diabetic Retinopathy (Low Acuity)</option>
            <option value="HEMIANOPIA" className="bg-slate-900 text-white">Hemianopia (Half-Field Loss)</option>
          </select>
        </div>

        {/* Simulator Toggle Button */}
        <button
          onClick={onToggleSimulator}
          className={`rounded-xl px-2.5 py-1 font-atkinson text-xs font-bold transition ${
            simulatorActive
              ? 'bg-amber-highlight text-slate-950 shadow-md shadow-amber-300/30'
              : 'border border-white/10 text-slate-300 hover:bg-white/10'
          }`}
          title="Toggle Caregiver / Evaluator Pathology Simulator (Hotkey: S)"
          aria-pressed={simulatorActive}
        >
          {simulatorActive ? 'Simulator: ON' : 'Simulator: OFF'}
        </button>

        {/* Calibration Page Link */}
        <Link
          href="/calibration"
          className="flex h-8 items-center gap-1 rounded-xl border border-white/10 px-2.5 font-atkinson text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
          title="Run 9-Point Eye Calibration"
        >
          <Crosshair className="h-3.5 w-3.5 text-cyan-highlight" />
          <span className="hidden sm:inline">Calibrate</span>
        </Link>

        {/* Profile Settings Link */}
        <Link
          href="/profile"
          className="flex h-8 items-center gap-1 rounded-xl border border-white/10 px-2.5 font-atkinson text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
          title="Ophthalmic Profile Settings"
        >
          <Settings className="h-3.5 w-3.5 text-amber-highlight" />
          <span className="hidden sm:inline">Profile</span>
        </Link>

        {/* Help Modal Trigger */}
        <button
          onClick={onOpenHelp}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-slate-300 transition hover:bg-white/10 hover:text-white"
          title="Keyboard Accessibility & Shortcut Guide (Hotkey: ?)"
          aria-label="Keyboard Shortcuts Guide"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
