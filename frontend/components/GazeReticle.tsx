'use client';

import React from 'react';
import { KinematicState } from '../types';

interface GazeReticleProps {
  x: number;
  y: number;
  kinematicState: KinematicState;
  dwellProgress: number; // 0.0 to 1.0
  isVisible?: boolean;
}

export const GazeReticle: React.FC<GazeReticleProps> = ({
  x,
  y,
  kinematicState,
  dwellProgress,
  isVisible = true
}) => {
  if (!isVisible || x <= 0 || y <= 0) return null;

  const isFixated = kinematicState === 'FIXATION';
  const isSaccade = kinematicState === 'SACCADE';

  // Perimeter for r=24: 2 * PI * 24 ≈ 150.8
  const circumference = 150.8;
  const strokeDashoffset = circumference * (1 - Math.max(0, Math.min(1, dwellProgress)));

  return (
    <div
      className="pointer-events-none fixed z-50 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
      style={{ left: `${x}px`, top: `${y}px` }}
      aria-hidden="true"
    >
      {/* Outer Saccadic / Search Breathing Ring */}
      <div
        className={`absolute -inset-2 rounded-full transition-all duration-150 ${
          isSaccade
            ? 'scale-125 border border-cyan-400/40 bg-cyan-500/10'
            : isFixated
            ? 'scale-100 border border-amber-300/60 bg-amber-400/15'
            : 'scale-90 border border-white/20'
        }`}
      />

      {/* SVG Circular Progress Dwell Arc */}
      <svg className="h-12 w-12 transform -rotate-90" viewBox="0 0 56 56">
        {/* Track */}
        <circle
          cx="28"
          cy="28"
          r="24"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="3"
          fill="none"
        />
        {/* Animated Dwell Arc */}
        {dwellProgress > 0 && (
          <circle
            cx="28"
            cy="28"
            r="24"
            stroke={dwellProgress >= 1.0 ? '#4ADE80' : '#FDE047'}
            strokeWidth="3.5"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-75"
          />
        )}
      </svg>

      {/* Center Core Dot */}
      <div
        className={`absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-md transition-colors ${
          dwellProgress >= 1.0
            ? 'bg-emerald-400 shadow-emerald-400/80'
            : isFixated
            ? 'bg-amber-300 shadow-amber-300/80'
            : 'bg-cyan-400 shadow-cyan-400/60'
        }`}
      />
    </div>
  );
};
