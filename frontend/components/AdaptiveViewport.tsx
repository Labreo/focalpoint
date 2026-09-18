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
  onMouseMoveSimulate?: (x: number, y: number) => void;
  onSourceRef?: (source: HTMLCanvasElement | HTMLVideoElement | null) => void;
}

export const AdaptiveViewport: React.FC<AdaptiveViewportProps> = ({
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
  onMouseMoveSimulate,
  onSourceRef
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Notify parent of active media source for differential engine
  useEffect(() => {
    if (onSourceRef) {
      if (mediaStream && videoRef.current) {
        onSourceRef(videoRef.current);
      } else if (canvasRef.current) {
        onSourceRef(canvasRef.current);
      }
    }
  }, [mediaStream, demoScene, onSourceRef]);

  const [viewportSize, setViewportSize] = useState({ width: 1280, height: 720 });

  // Update viewport dimensions on resize
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

  // Connect WebRTC mediaStream to HTML5 video element
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(() => {});
    }
  }, [mediaStream]);

  // Render loop for Demo Scenes
  useEffect(() => {
    let animationFrameId: number;
    let startTime = performance.now();

    const render = () => {
      const canvas = canvasRef.current;
      if (canvas && demoScene && !mediaStream) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const elapsedSec = (performance.now() - startTime) / 1000.0;
          demoScene.canvasRender(ctx, w, h, elapsedSec);
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    if (!isFrozen) {
      animationFrameId = requestAnimationFrame(render);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [demoScene, mediaStream, isFrozen]);

  // Compute active pathology CSS transforms and filters
  const pathologyTransform = computePathologyTransform(
    activePathology,
    gazePoint,
    viewportSize
  );

  // Handle manual mouse hover for testing without eye tracker
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (onMouseMoveSimulate) {
      onMouseMoveSimulate(e.clientX, e.clientY);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden bg-slate-950 select-none"
      style={{
        transform: pathologyTransform.viewportTransform,
        transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Media Canvas Stage (for Demo Broadcast Scenes) */}
      {!mediaStream && demoScene && (
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="h-full w-full object-contain"
          style={{
            filter: pathologyTransform.canvasFilter
          }}
        />
      )}

      {/* Live Video Element (for Screen Capture or Webcam) */}
      {mediaStream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-contain"
          style={{
            filter: pathologyTransform.canvasFilter
          }}
        />
      )}

      {/* Pathology Mask Overlay (Central Scotoma or Tunnel Vision Mask) */}
      {pathologyTransform.maskOverlay && (
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: pathologyTransform.maskOverlay
          }}
          aria-hidden="true"
        />
      )}

      {/* Interactive Semantic Region Overlay Contours */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {semanticRegions.map((region) => {
          if (region.type === 'BACKGROUND_CONTEXT') return null;

          const box = region.boundingBox;
          const isFocused = activeFocusedRegion?.id === region.id;

          // Color & Icon mapping based on semantic entity type
          let borderColor = 'border-amber-highlight/60';
          let bgColor = 'bg-amber-400/5';
          let tagBadgeColor = 'bg-amber-highlight text-slate-950';
          let IconComponent = Type;

          if (region.type === 'FACIAL_PORTRAIT') {
            borderColor = 'border-cyan-highlight/70';
            bgColor = 'bg-cyan-500/10';
            tagBadgeColor = 'bg-cyan-highlight text-slate-950';
            IconComponent = User;
          } else if (region.type === 'PERSISTENT_HUD') {
            borderColor = 'border-emerald-400/80';
            bgColor = 'bg-emerald-500/10';
            tagBadgeColor = 'bg-emerald-400 text-slate-950';
            IconComponent = BarChart2;
          }

          return (
            <div
              key={region.id}
              onClick={() => onRegionDwellComplete(region)}
              className={`pointer-events-auto absolute cursor-pointer rounded-xl border-2 transition-all duration-200 ${borderColor} ${bgColor} ${
                isFocused
                  ? 'ring-4 ring-amber-300 ring-offset-2 ring-offset-slate-950 shadow-2xl scale-[1.01]'
                  : 'hover:border-white hover:bg-white/10'
              }`}
              style={{
                left: `${box.left * 100}%`,
                top: `${box.top * 100}%`,
                width: `${box.width * 100}%`,
                height: `${box.height * 100}%`
              }}
              role="button"
              tabIndex={0}
              aria-label={`Select ${region.type.replace('_', ' ')}`}
            >
              {/* Semantic Tag Header */}
              <div className="absolute -top-6 left-2 flex items-center gap-1.5 rounded-t-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-md">
                <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 ${tagBadgeColor}`}>
                  <IconComponent className="h-3 w-3" />
                  <span>{region.type.replace('_', ' ')}</span>
                </span>

                {/* HUD Pin Action Shortcut */}
                {region.type === 'PERSISTENT_HUD' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPinHUD(region);
                    }}
                    className="flex items-center gap-1 rounded bg-slate-900/90 px-1.5 py-0.5 text-emerald-400 hover:bg-emerald-400 hover:text-slate-950 transition"
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
                  className="absolute bottom-0 left-0 top-0 bg-amber-400/20 transition-all duration-75"
                  style={{ width: `${dwellProgress * 100}%` }}
                />
              )}
            </div>
          );
        })}
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
