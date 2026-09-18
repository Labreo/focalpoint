'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Crosshair, 
  Camera, 
  Settings, 
  HelpCircle, 
  MousePointer,
  CheckCircle2
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
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-4 py-2.5 select-none">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        {/* Left: Brand Logo & Workspace Tag */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-400 text-black font-black shadow-sm group-hover:bg-amber-300 transition">
              <Crosshair className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-base font-bold tracking-tight text-zinc-100">
                Focal<span className="text-amber-400">Point</span>
              </span>
              <span className="hidden rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-zinc-400 sm:inline">
                STUDIO
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Mode Switcher */}
        <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/90 p-0.5 text-xs">
          <button
            onClick={() => { if (simulatorActive) onToggleSimulator(); }}
            className={`rounded-md px-3 py-1 font-medium transition ${
              !simulatorActive
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Assistive View
          </button>
          <button
            onClick={() => { if (!simulatorActive) onToggleSimulator(); }}
            className={`rounded-md px-3 py-1 font-medium transition ${
              simulatorActive
                ? 'bg-amber-400/15 text-amber-300 shadow-sm border border-amber-400/30 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Simulate patient vision (Macular Degeneration Central Scotoma or Tunnel Vision)"
          >
            Pathology Simulator
          </button>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2">
          {/* Dual Input Mode: Biometric Iris vs Ergonomic Motor Assist */}
          {onToggleInputMode && (
            <button
              onClick={onToggleInputMode}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono transition ${
                inputMode === 'EYE_TRACKER'
                  ? 'border-zinc-700 bg-zinc-800/80 text-zinc-200 font-semibold'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
              title={
                inputMode === 'EYE_TRACKER'
                  ? 'Active: Biometric Iris Gaze Tracker (TensorFlow FaceMesh + 2D Kalman filter)'
                  : 'Active: Ergonomic Motor Assistive Mode (Alternative Input for tremors/nystagmus)'
              }
            >
              {inputMode === 'EYE_TRACKER' ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <span>Iris Gaze</span>
                </>
              ) : (
                <>
                  <MousePointer className="h-3 w-3 text-amber-400" />
                  <span>Motor Assist</span>
                </>
              )}
            </button>
          )}

          {/* 9-Point Calibration Link */}
          <Link
            href="/calibration"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              isCalibrated
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20'
            }`}
            title={isCalibrated ? 'Iris calibrated with 9 points' : 'Uncalibrated - click to run 9-point calibration'}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isCalibrated ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            <span>{isCalibrated ? 'Calibrated' : 'Calibrate'}</span>
          </Link>

          {/* Eye Tracking Toggle Button */}
          <button
            onClick={onToggleWebGazer}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              isWebGazerActive
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title={isWebGazerActive ? 'Click to stop webcam eye tracking' : 'Click to start real webcam eye tracking'}
          >
            <Camera className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isWebGazerActive ? 'Webcam ON' : 'Webcam'}</span>
          </button>

          {/* Profile */}
          <Link
            href="/profile"
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
            title="Configure ophthalmic pathology profile"
          >
            <Settings className="h-3.5 w-3.5" />
          </Link>

          {/* Help */}
          <button
            onClick={onOpenHelp}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
            title="Keyboard shortcuts & help"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
