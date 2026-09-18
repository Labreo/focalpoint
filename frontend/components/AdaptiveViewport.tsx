'use client';

import React, { useRef, useEffect, useState } from 'react';
import { 
  SemanticRegion, 
  PathologyConfig, 
  KinematicState, 
  DemoScene 
} from '../types';
import { GazeReticle } from './GazeReticle';
import { computePathologyTransform } from '../lib/pathology_transforms';
import { Pin, Type, User, BarChart2 } from 'lucide-react';

interface AdaptiveViewportProps {
  videoSrc?: string | null;
  mediaStream: MediaStream | null;
  demoScene: DemoScene | null;
  semanticRegions: SemanticRegion[];
  activePathology: PathologyConfig;
  gazePoint: { x: number; y: number };
  kinematicState: KinematicState;
  dwellProgress: number;
  activeFocusedRegion: SemanticRegion | null;
  onRegionDwellComplete: (region: SemanticRegion) => void;
  onPinHUD: (region: SemanticRegion) => void;
  isFrozen: boolean;
  simulatorActive?: boolean;
  onMouseMoveSimulate?: (x: number, y: number) => void;
  onSourceRef?: (source: HTMLVideoElement | HTMLCanvasElement | null) => void;
}

export const AdaptiveViewport: React.FC<AdaptiveViewportProps> = ({
  videoSrc,
  mediaStream,
  demoScene,
  semanticRegions,
  activePathology,
  gazePoint,
  kinematicState,
  dwellProgress,
  activeFocusedRegion,
  onRegionDwellComplete,
  onPinHUD,
  isFrozen,
  simulatorActive = false,
  onMouseMoveSimulate,
  onSourceRef
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Notify parent of active video source for frame capture
  useEffect(() => {
    if (onSourceRef && videoRef.current) {
      onSourceRef(videoRef.current);
    }
  }, [videoSrc, mediaStream, onSourceRef]);

  const [viewportSize, setViewportSize] = useState({ width: 1280, height: 720 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewportSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Connect WebRTC mediaStream or videoSrc to HTML5 video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (mediaStream) {
      video.srcObject = mediaStream;
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
      if (videoSrc) {
        video.src = videoSrc;
        video.play().catch(() => {});
      }
    }
  }, [mediaStream, videoSrc]);

  // Handle freeze / play state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isFrozen) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isFrozen]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  // Compute active pathology CSS transforms and filters
  const pathologyTransform = computePathologyTransform(
    activePathology,
    gazePoint,
    viewportSize
  );

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (onMouseMoveSimulate && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      onMouseMoveSimulate(x, y);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-black select-none shadow-2xl"
      style={{
        transform: simulatorActive ? pathologyTransform.viewportTransform : undefined,
        transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Real HTML5 Video Player */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        loop
        muted={isMuted}
        className="h-full w-full object-contain"
        style={{
          filter: simulatorActive ? pathologyTransform.canvasFilter : undefined
        }}
      />

      {/* Pathology Mask Overlay (Central Scotoma or Tunnel Vision Mask - only in Simulator Mode) */}
      {simulatorActive && pathologyTransform.maskOverlay && (
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: pathologyTransform.maskOverlay
          }}
          aria-hidden="true"
        />
      )}

      {/* Interactive Semantic Region Bounding Boxes */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {semanticRegions.map((region) => {
          if (region.type === 'BACKGROUND_CONTEXT') return null;

          const box = region.boundingBox;
          const isFocused = activeFocusedRegion?.id === region.id;

          let borderColor = 'border-amber-400/80';
          let bgColor = 'bg-amber-400/10';
          let tagBadgeColor = 'bg-amber-400 text-black';
          let IconComponent = Type;

          if (region.type === 'FACIAL_PORTRAIT') {
            borderColor = 'border-cyan-400/80';
            bgColor = 'bg-cyan-500/15';
            tagBadgeColor = 'bg-cyan-400 text-black';
            IconComponent = User;
          } else if (region.type === 'PERSISTENT_HUD') {
            borderColor = 'border-emerald-400/90';
            bgColor = 'bg-emerald-500/15';
            tagBadgeColor = 'bg-emerald-400 text-black';
            IconComponent = BarChart2;
          }

          return (
            <div
              key={region.id}
              onClick={() => onRegionDwellComplete(region)}
              className={`pointer-events-auto absolute cursor-pointer rounded-lg border-2 transition-all duration-150 ${borderColor} ${bgColor} ${
                isFocused
                  ? 'ring-4 ring-amber-300 ring-offset-2 ring-offset-black shadow-2xl scale-[1.01]'
                  : 'hover:border-white hover:bg-white/15'
              }`}
              style={{
                left: `${box.left * 100}%`,
                top: `${box.top * 100}%`,
                width: `${box.width * 100}%`,
                height: `${box.height * 100}%`
              }}
              role="button"
              tabIndex={0}
              aria-label={`Select ${region.type.replace('_', ' ')}: ${region.textContent}`}
            >
              {/* Semantic Tag Header */}
              <div className="absolute -top-5 left-1 flex items-center gap-1 text-[10px] font-bold shadow-md">
                <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 ${tagBadgeColor}`}>
                  <IconComponent className="h-3 w-3" />
                  <span>{region.type === 'PERSISTENT_HUD' ? 'LIVE SCOREBOARD' : region.type.replace('_', ' ')}</span>
                </span>

                {/* HUD Pin Action Shortcut */}
                {region.type === 'PERSISTENT_HUD' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPinHUD(region);
                    }}
                    className="flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-emerald-300 hover:bg-emerald-400 hover:text-black transition"
                    title="Pin this scoreboard to periphery"
                  >
                    <Pin className="h-2.5 w-2.5" />
                    <span>PIN</span>
                  </button>
                )}
              </div>

              {/* Dwell Progress Shimmer inside bounding box */}
              {isFocused && dwellProgress > 0 && (
                <div
                  className="absolute bottom-0 left-0 top-0 bg-amber-400/30 transition-all duration-75"
                  style={{ width: `${dwellProgress * 100}%` }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Video Overlay Playback Controls */}
      <div className="pointer-events-auto absolute bottom-3 right-3 z-30 flex items-center gap-2 rounded-lg bg-black/75 px-2.5 py-1.5 text-xs text-white backdrop-blur-md border border-white/10">
        <button
          onClick={togglePlay}
          className="rounded px-2 py-1 font-bold hover:bg-white/20 transition text-slate-200"
          title={isPlaying ? "Pause video" : "Play video"}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          onClick={toggleMute}
          className="rounded px-2 py-1 font-bold hover:bg-white/20 transition text-slate-200"
          title={isMuted ? "Unmute audio" : "Mute audio"}
        >
          {isMuted ? '🔇 Unmute' : '🔊 Mute'}
        </button>
      </div>

      {/* Smoothed Kalman Gaze Reticle */}
      <GazeReticle
        x={gazePoint.x}
        y={gazePoint.y}
        kinematicState={kinematicState}
        dwellProgress={dwellProgress}
        isVisible={true}
      />
    </div>
  );
};
