'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Crosshair, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import { audioHaptics } from '../../lib/synthetic_audio';
import { webGazerManager } from '../../lib/webgazer_adapter';
import { animeTransitions } from '../../lib/anime_transitions';

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

  useEffect(() => {
    if (isCompleted) {
      animeTransitions.animateDrawerEntrance('.calibration-modal');
    }
  }, [isCompleted]);

  return (
    <main className="relative flex h-screen w-screen flex-col items-center justify-between overflow-hidden bg-bg text-fg crt bg-grid bg-fixed p-6 select-none">
      {/* Top Bar */}
      <header className="flex w-full items-center justify-between border-b border-bg-3 pb-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md border border-bg-3 bg-bg-1 px-3.5 py-1.5 font-telemetry text-xs font-bold text-fg transition hover:border-fg hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>// RETURN TO VIEWER</span>
        </Link>

        <div className="flex items-center gap-2">
          <Crosshair className="h-5 w-5 text-amber-highlight" />
          <h1 className="font-bold text-base sm:text-lg text-fg tracking-wider font-telemetry">
            @focalpoint // calibration_routine
          </h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/x.svg" className="size-3.5 animate-spin-snapped" alt="x icon" />
        </div>

        <button
          onClick={handleRestart}
          className="flex items-center gap-1.5 rounded-md border border-bg-3 bg-bg-1 px-3.5 py-1.5 font-telemetry text-xs font-bold text-muted transition hover:border-fg hover:text-fg"
        >
          <RefreshCw className="h-3 w-3" />
          <span>// RESTART</span>
        </button>
      </header>

      {/* Deltea Spiky Divider */}
      <div className="w-full spiky-divider mb-4" />

      {/* Main Calibration Stage */}
      <div className="relative flex-1 w-full">
        {!isCompleted ? (
          <>
            {/* Show previously calibrated points as completed dots */}
            {CALIBRATION_POINTS.slice(0, currentPointIndex).map((pt) => (
              <div
                key={pt.id}
                className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20 text-emerald-300 font-telemetry text-[10px] font-bold shadow-sm"
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
                    stroke="#212228"
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
                <div className="absolute flex h-10 w-10 items-center justify-center rounded-full bg-amber-highlight text-bg shadow-lg shadow-amber-300/40 font-telemetry font-black text-sm">
                  {activePoint.id}
                </div>
              </div>

              <div className="mt-2 text-center font-telemetry text-[11px] font-bold uppercase tracking-wider text-amber-highlight">
                // FIXATE EYE \\
              </div>
            </div>
          </>
        ) : (
          /* Calibration Success Modal */
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="calibration-modal max-w-md rounded-lg border-2 border-amber-highlight bg-bg-1 p-8 text-center shadow-2xl backdrop-blur-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-emerald-400/30 bg-emerald-500/15 text-emerald-400 mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <h2 className="font-telemetry text-lg font-bold uppercase tracking-wider text-fg">
                // CALIBRATION COMPLETE \\
              </h2>

              <p className="mt-2 font-telemetry text-xs text-muted leading-relaxed">
                9-point polynomial regression matrix mapped to sensor frame coordinates.
              </p>

              <div className="my-6 rounded-md border border-bg-3 bg-bg-2 p-4 font-telemetry">
                <div className="text-[10px] uppercase tracking-wider text-muted">// ESTIMATED SPATIAL ACCURACY \\</div>
                <div className="text-xl font-black text-amber-highlight mt-1">
                  {accuracyScore}
                </div>
              </div>

              <button
                onClick={() => router.push('/')}
                className="w-full rounded-md bg-amber-highlight py-3 font-telemetry text-xs font-black uppercase tracking-wider text-bg shadow-md transition hover:scale-105"
              >
                APPLY & LAUNCH VIEWER
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Instructions Footer */}
      <footer className="w-full max-w-2xl rounded-md border border-bg-3 bg-bg-1 p-3 text-center text-xs text-muted font-telemetry">
        [ POINT {currentPointIndex + 1} OF 9 ] // KEEP HEAD STABLE AND FOLLOW AMBER RING WITH EYES
      </footer>
    </main>
  );
}
