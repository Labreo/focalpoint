'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Eye, Minimize2, Maximize2, ShieldCheck, X } from 'lucide-react';

interface WebcamPipProps {
  isActive: boolean;
  onClose?: () => void;
  inputMode: 'EYE_TRACKER' | 'MOUSE_DEBUG';
  isWebGazerActive?: boolean;
}

export const WebcamPip: React.FC<WebcamPipProps> = ({
  isActive,
  onClose,
  inputMode,
  isWebGazerActive = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(30);

  useEffect(() => {
    let isCancelled = false;

    if (!isActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setHasPermission(null);
      return;
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user',
            frameRate: { ideal: 30 }
          },
          audio: false
        });

        if (isCancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setHasPermission(true);
        setErrorMessage(null);
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('Webcam PIP permission denied or unavailable:', err);
          setHasPermission(false);
          setErrorMessage(err.message || 'Camera permission denied');
        }
      }
    };

    startCamera();

    return () => {
      isCancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      className={`pointer-events-auto absolute z-40 transition-all duration-300 select-none shadow-2xl rounded-xl border border-amber-400/60 bg-zinc-950/90 backdrop-blur-md overflow-hidden ${
        isMinimized
          ? 'bottom-4 right-4 w-44 h-11'
          : 'bottom-4 right-4 w-52 sm:w-60 aspect-[4/3]'
      }`}
      style={{
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(251, 191, 36, 0.2)'
      }}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-zinc-900/90 border-b border-zinc-800 text-[10px] font-mono text-zinc-300">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-bold text-zinc-100 uppercase tracking-wider">
            {inputMode === 'EYE_TRACKER' ? 'IRIS GAZE' : 'CAM FEED'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(prev => !prev)}
            className="rounded p-0.5 text-zinc-400 hover:text-white transition"
            title={isMinimized ? 'Expand Camera Feed' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded p-0.5 text-zinc-400 hover:text-red-400 transition"
              title="Close Camera Feed"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Video Viewport (Hidden when Minimized) */}
      {!isMinimized && (
        <div className="relative w-full h-[calc(100%-28px)] bg-black overflow-hidden flex items-center justify-center">
          {hasPermission === false ? (
            <div className="flex flex-col items-center justify-center p-3 text-center text-zinc-400 text-xs font-mono">
              <CameraOff className="h-6 w-6 text-red-400 mb-1" />
              <span>Camera Inactive</span>
              <span className="text-[9px] text-zinc-500 mt-1">Allow webcam access in browser</span>
            </div>
          ) : (
            <>
              {/* Real HTML5 Live Video Stream from User Webcam (Mirrored) */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* Sci-Fi Iris Tracking Brackets Overlay */}
              <div className="pointer-events-none absolute inset-0 border border-amber-400/20 m-2 rounded-lg flex flex-col justify-between p-1.5">
                <div className="flex justify-between items-start">
                  <div className="w-3 h-3 border-t-2 border-l-2 border-amber-400/80" />
                  <div className="w-3 h-3 border-t-2 border-r-2 border-amber-400/80" />
                </div>

                {/* Simulated Ocular Crosshair */}
                <div className="flex items-center justify-center">
                  <div className="relative flex items-center justify-center size-8 rounded-full border border-amber-400/40 animate-pulse">
                    <div className="size-1 rounded-full bg-amber-400" />
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div className="w-3 h-3 border-b-2 border-l-2 border-amber-400/80" />
                  <div className="w-3 h-3 border-b-2 border-r-2 border-amber-400/80" />
                </div>
              </div>

              {/* Lower HUD Telemetry Pill */}
              <div className="pointer-events-none absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-950/80 backdrop-blur-sm border border-zinc-800">
                <span className="text-amber-300 font-semibold">
                  {inputMode === 'EYE_TRACKER' ? 'IRIS 473 LOCK' : 'HEAD POSE TRACK'}
                </span>
                <span className="text-emerald-400">30 FPS</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
