'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Crosshair, 
  Camera, 
  Settings, 
  Sliders, 
  HelpCircle, 
  CheckCircle2, 
  MousePointer 
} from 'lucide-react';

interface NavbarProps {
  isWebGazerActive: boolean;
  onToggleWebGazer: () => void;
  simulatorActive: boolean;
  onToggleSimulator: () => void;
  onOpenHelp: () => void;
  isCalibrated?: boolean;
  inputMode?: 'EYE_TRACKER' | 'MOUSE_DEBUG';
  onToggleInputMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isWebGazerActive,
  onToggleWebGazer,
  simulatorActive,
  onToggleSimulator,
  onOpenHelp,
  isCalibrated = false,
  inputMode = 'EYE_TRACKER',
  onToggleInputMode
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 py-3 select-none">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        {/* Brand Logo & Subtitle */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-black font-black shadow-md">
              <Crosshair className="h-5 w-5" />
            </div>
            <div>
              <span className="font-sans text-lg font-black tracking-tight text-white">
                Focal<span className="text-amber-400">Point</span>
              </span>
              <span className="ml-2 hidden rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400 sm:inline">
                AWS Track 2 • Ship It
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Mode Switcher */}
        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/80 p-1 text-xs">
          <button
            onClick={() => { if (simulatorActive) onToggleSimulator(); }}
            className={`rounded-md px-3 py-1 font-bold transition ${
              !simulatorActive
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            👁️ Assistive View
          </button>
          <button
            onClick={() => { if (!simulatorActive) onToggleSimulator(); }}
            className={`rounded-md px-3 py-1 font-bold transition ${
              simulatorActive
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Simulate patient vision (Macular Degeneration Central Scotoma or Tunnel Vision)"
          >
            🔬 Clinical Simulator
          </button>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2">
          {/* Eye Tracking Toggle Button */}
          <button
            onClick={onToggleWebGazer}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-sm ${
              isWebGazerActive
                ? 'border border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-amber-400 text-black hover:bg-amber-300'
            }`}
            title={isWebGazerActive ? 'Click to stop webcam eye tracking' : 'Click to start real webcam eye tracking'}
          >
            {isWebGazerActive ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>👁️ Iris Tracking: ON</span>
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5" />
                <span>Start Webcam Gaze</span>
              </>
            )}
          </button>

          {/* Dual Input Mode: Biometric Iris vs Ergonomic Motor Assist */}
          {onToggleInputMode && (
            <button
              onClick={onToggleInputMode}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-mono font-bold transition ${
                inputMode === 'EYE_TRACKER'
                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
              title={
                inputMode === 'EYE_TRACKER'
                  ? 'Active: Biometric Iris Gaze Tracker (TensorFlow FaceMesh + 2D Kalman filter)'
                  : 'Active: Ergonomic Motor Assistive Mode (Alternative Input for tremors/nystagmus)'
              }
            >
              {inputMode === 'EYE_TRACKER' ? (
                <>
                  <span>👁️ Biometric Iris</span>
                </>
              ) : (
                <>
                  <MousePointer className="h-3 w-3 text-amber-400" />
                  <span>♿ Ergonomic Motor</span>
                </>
              )}
            </button>
          )}

          {/* 9-Point Calibration Link */}
          <Link
            href="/calibration"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
              isCalibrated
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'border-amber-400/60 bg-amber-400/10 text-amber-300 animate-pulse hover:bg-amber-400/20'
            }`}
            title={isCalibrated ? 'Iris calibrated with 9 points' : 'Uncalibrated - click to run 9-point calibration'}
          >
            <span>🎯 {isCalibrated ? 'Calibrated (9-Pt)' : 'Calibrate 9-Pts'}</span>
          </Link>

          {/* Profile */}
          <Link
            href="/profile"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
            title="Configure ophthalmic pathology and PRL offsets"
          >
            <Settings className="h-3.5 w-3.5" />
          </Link>

          {/* Help */}
          <button
            onClick={onOpenHelp}
            className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title="Keyboard shortcuts & help"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
