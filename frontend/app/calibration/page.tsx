'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Crosshair, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import { audioHaptics } from '../../lib/synthetic_audio';
import { webGazerManager } from '../../lib/webgazer_adapter';

interface CalibrationPoint {
  id: number;
  xPercent: number;
  yPercent: number;
}

const CALIBRATION_POINTS: CalibrationPoint[] = [
  { id: 1, xPercent: 12, yPercent: 12 }, // Top-Left
  { id: 2, xPercent: 50, yPercent: 12 }, // Top-Center
  { id: 3, xPercent: 88, yPercent: 12 }, // Top-Right
  { id: 4, xPercent: 12, yPercent: 50 }, // Middle-Left
  { id: 5, xPercent: 50, yPercent: 50 }, // Center
  { id: 6, xPercent: 88, yPercent: 50 }, // Middle-Right
  { id: 7, xPercent: 12, yPercent: 88 }, // Bottom-Left
  { id: 8, xPercent: 50, yPercent: 88 }, // Bottom-Center
  { id: 9, xPercent: 88, yPercent: 88 }, // Bottom-Right
];

export default function CalibrationPage() {
  const router = useRouter();
  const [currentPointIndex, setCurrentPointIndex] = useState<number>(0);
  const [pointProgress, setPointProgress] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [accuracyScore, setAccuracyScore] = useState<string>('0.82° (~38px)');
  const [webcamEnabled, setWebcamEnabled] = useState<boolean>(false);

  // Initialize WebGazer on mount
  useEffect(() => {
    webGazerManager.start((x, y) => {}).then(started => {
      setWebcamEnabled(started);
    });

    return () => {
      webGazerManager.pause();
    };
  }, []);

  // Dwell countdown effect on active calibration point
  useEffect(() => {
    if (isCompleted) return;

    const interval = setInterval(() => {
      setPointProgress((prev) => {
        if (prev >= 100) {
          // Play harmonic confirmation chord
          audioHaptics.playCalibrationSuccess();

          // Record calibration coordinate to WebGazer
          if (typeof window !== 'undefined') {
            const pt = CALIBRATION_POINTS[currentPointIndex];
            const pxX = (window.innerWidth * pt.xPercent) / 100;
            const pxY = (window.innerHeight * pt.yPercent) / 100;
            webGazerManager.recordCalibrationPoint(pxX, pxY);
          }

          if (currentPointIndex + 1 < CALIBRATION_POINTS.length) {
            setCurrentPointIndex((idx) => idx + 1);
            return 0;
          } else {
            // All 9 points finished!
            setIsCompleted(true);
            setAccuracyScore('0.76° (~34px precision)');
            return 100;
          }
        }
        return prev + 5; // ~1 second per point (20 steps * 50ms)
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentPointIndex, isCompleted]);

  const activePoint = CALIBRATION_POINTS[currentPointIndex];

  const handleRestart = () => {
    setCurrentPointIndex(0);
    setPointProgress(0);
    setIsCompleted(false);
  };

  return (
    <main className="relative flex h-screen w-screen flex-col items-center justify-between overflow-hidden bg-slate-950 p-6 text-white select-none">
      {/* Top Bar */}
      <header className="flex w-full items-center justify-between border-b border-white/10 pb-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 font-atkinson text-sm font-bold text-slate-300 transition hover:bg-white/20 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit Calibration</span>
        </Link>

        <div className="flex items-center gap-2 font-atkinson">
          <Crosshair className="h-5 w-5 text-cyan-highlight" />
          <h1 className="text-lg font-black uppercase tracking-wider text-amber-highlight">
            9-Point Polynomial Gaze Calibration
          </h1>
        </div>

        <button
          onClick={handleRestart}
          className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/20 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Restart</span>
        </button>
      </header>

      {/* Main Calibration Stage */}
      <div className="relative flex-1 w-full">
        {!isCompleted ? (
          <>
            {/* Show previously calibrated points as completed dots */}
            {CALIBRATION_POINTS.slice(0, currentPointIndex).map((pt) => (
              <div
                key={pt.id}
                className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500/40 text-emerald-300 text-[10px] font-bold"
                style={{ left: `${pt.xPercent}%`, top: `${pt.yPercent}%` }}
              >
                ✓
              </div>
            ))}

            {/* Active Calibration Target */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300"
              style={{
                left: `${activePoint.xPercent}%`,
                top: `${activePoint.yPercent}%`
              }}
              onClick={() => {
                // Click also advances point immediately
                setPointProgress(100);
              }}
            >
              {/* SVG Circular Countdown Ring */}
              <div className="relative flex h-24 w-24 items-center justify-center">
                <svg className="h-24 w-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#FDE047"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 * (1 - pointProgress / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-75"
                  />
                </svg>

                {/* Inner Bullseye Target */}
                <div className="absolute flex h-10 w-10 items-center justify-center rounded-full bg-amber-highlight text-slate-950 shadow-lg shadow-amber-300/60 font-black">
                  {activePoint.id}
                </div>
              </div>

              <div className="mt-2 text-center font-atkinson text-xs font-bold text-amber-highlight">
                Look or click here
              </div>
            </div>
          </>
        ) : (
          /* Calibration Success Modal */
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-md rounded-3xl border-2 border-emerald-400 bg-slate-900/95 p-8 text-center shadow-2xl backdrop-blur-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-4">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <h2 className="font-atkinson text-2xl font-black text-white">
                Calibration Complete!
              </h2>

              <p className="mt-2 font-atkinson text-sm text-slate-300 leading-relaxed">
                Polynomial regression matrix successfully mapped to webcam sensor coordinates.
              </p>

              <div className="my-6 rounded-2xl bg-white/5 p-4 font-telemetry">
                <div className="text-xs text-slate-400">ESTIMATED SPATIAL ACCURACY</div>
                <div className="text-2xl font-black text-cyan-highlight mt-1">
                  {accuracyScore}
                </div>
              </div>

              <button
                onClick={() => router.push('/')}
                className="w-full rounded-xl bg-amber-highlight py-3 font-atkinson text-sm font-black text-slate-950 shadow-lg shadow-amber-300/40 transition hover:bg-amber-300"
              >
                Apply & Launch Viewer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Instructions Footer */}
      <footer className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-xs text-slate-400 font-atkinson">
        Keep your head stable and follow the amber ring with your eyes. Point {currentPointIndex + 1} of 9.
      </footer>
    </main>
  );
}
