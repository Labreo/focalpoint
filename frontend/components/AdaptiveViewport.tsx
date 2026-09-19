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
import { WebGLShaderPipeline, ShaderRenderOptions } from '../lib/webgl_shader_pipeline';
import { TemporalTrackingEngine } from '../lib/temporal_tracker';
import { WebcamPip } from './WebcamPip';
import { 
  Pin, 
  Type, 
  User, 
  BarChart2, 
  Cpu, 
  Sparkles, 
  Minimize2, 
  Maximize, 
  ZoomIn, 
  Crosshair, 
  Layers, 
  Camera, 
  CameraOff, 
  MousePointer, 
  MouseOff 
} from 'lucide-react';

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
  onResetFocus?: () => void;
  pinnedHUDRegions?: SemanticRegion[];
  onUnpinHUD?: (regionId: string) => void;
  isFrozen: boolean;
  simulatorActive?: boolean;
  inputMode?: 'EYE_TRACKER' | 'MOUSE_DEBUG';
  zoomComfortLevel?: 'GENTLE' | 'BALANCED' | 'HIGH';
  onMouseMoveSimulate?: (x: number, y: number) => void;
  onSourceRef?: (source: HTMLVideoElement | HTMLCanvasElement | null) => void;
  onContainerRectChange?: (rect: DOMRect) => void;
  onActiveRegionsUpdate?: (regions: SemanticRegion[]) => void;
  hideMouseCursor?: boolean;
  isWebcamActive?: boolean;
  onToggleWebcam?: () => void;
  onToggleHideCursor?: () => void;
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
  onResetFocus,
  pinnedHUDRegions = [],
  onUnpinHUD,
  isFrozen,
  simulatorActive = false,
  inputMode = 'EYE_TRACKER',
  zoomComfortLevel = 'BALANCED',
  onMouseMoveSimulate,
  onSourceRef,
  onContainerRectChange,
  onActiveRegionsUpdate,
  hideMouseCursor = true,
  isWebcamActive = false,
  onToggleWebcam,
  onToggleHideCursor
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pipelineRef = useRef<WebGLShaderPipeline | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Dynamic 60 FPS Temporal Keyframe Track State
  const [temporalRegions, setTemporalRegions] = useState<SemanticRegion[]>(semanticRegions);
  const lastTimeSampleRef = useRef<number>(-1);
  const onActiveRegionsUpdateRef = useRef(onActiveRegionsUpdate);

  useEffect(() => {
    onActiveRegionsUpdateRef.current = onActiveRegionsUpdate;
  }, [onActiveRegionsUpdate]);

  // Synchronize when parent changes scenes or updates semantic tracks
  useEffect(() => {
    lastTimeSampleRef.current = -1;
    const video = videoRef.current;
    const t = video ? video.currentTime : 0;
    const resolved = TemporalTrackingEngine.getActiveRegionsAtTime(semanticRegions, t);
    setTemporalRegions(resolved);
    onActiveRegionsUpdateRef.current?.(resolved);
  }, [semanticRegions]);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [useWebGL, setUseWebGL] = useState<boolean>(true);
  const [webGLActive, setWebGLActive] = useState<boolean>(false);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({ width: 1280, height: 720 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current) {
        containerRef.current.requestFullscreen().catch(err => {
          console.warn('Fullscreen request failed:', err);
        });
      }
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Sync fullscreen state with document events
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard shortcut listeners (Escape to reset zoom, F for fullscreen, W for webcam, C for cursor)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape' && onResetFocus) {
        onResetFocus();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'w' && onToggleWebcam) {
        e.preventDefault();
        onToggleWebcam();
      } else if (e.key.toLowerCase() === 'c' && onToggleHideCursor) {
        e.preventDefault();
        onToggleHideCursor();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onResetFocus, onToggleWebcam, onToggleHideCursor]);

  // Measure container rect & viewport dimensions
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewportSize({ width: rect.width, height: rect.height });
        if (onContainerRectChange) {
          onContainerRectChange(rect);
        }
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('scroll', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('scroll', updateSize);
    };
  }, [onContainerRectChange]);

  // Initialize WebGL GPU Fragment Shader Pipeline
  useEffect(() => {
    if (canvasRef.current && !pipelineRef.current) {
      try {
        pipelineRef.current = new WebGLShaderPipeline(canvasRef.current);
        setWebGLActive(true);
      } catch (err) {
        console.warn('WebGL initialization failed, falling back to Canvas2D/CSS:', err);
        setWebGLActive(false);
      }
    }
    return () => {
      if (pipelineRef.current) {
        pipelineRef.current.destroy();
        pipelineRef.current = null;
      }
    };
  }, []);

  // 60 FPS GPU Fragment Shader Render Loop
  useEffect(() => {
    let active = true;

    const renderLoop = () => {
      if (!active) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const pipeline = pipelineRef.current;

      if (useWebGL && webGLActive && video && canvas && pipeline && video.readyState >= 2) {
        try {
          if (video.videoWidth > 0 && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const options: ShaderRenderOptions = {
            pathologyType: activePathology.type as any,
            gazeX: Math.max(0, Math.min(1, gazePoint.x / Math.max(1, viewportSize.width))),
            gazeY: Math.max(0, Math.min(1, gazePoint.y / Math.max(1, viewportSize.height))),
            contrastBoost: activePathology.type === 'LOW_ACUITY' ? 1.65 : 1.15,
            scotomaRadius: (activePathology.scotomaRadiusPx || 110) / Math.max(1, viewportSize.width),
            tunnelRadius: (activePathology.tunnelRadiusPx || 220) / Math.max(1, viewportSize.width),
            gamma: 0.55,
            isSimulatorActive: simulatorActive
          };

          pipeline.render(video, options);
        } catch {}
      }

      // Dynamically interpolate semantic keyframe tracks at video.currentTime (25Hz sampling rate)
      if (video && !video.paused && Math.abs(video.currentTime - lastTimeSampleRef.current) > 0.04) {
        lastTimeSampleRef.current = video.currentTime;
        const resolved = TemporalTrackingEngine.getActiveRegionsAtTime(semanticRegions, video.currentTime);
        setTemporalRegions(resolved);
        onActiveRegionsUpdateRef.current?.(resolved);
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [useWebGL, webGLActive, activePathology, gazePoint, viewportSize, simulatorActive, semanticRegions]);

  // Notify parent of active video source for frame capture
  useEffect(() => {
    if (onSourceRef) {
      onSourceRef(useWebGL && webGLActive && canvasRef.current ? canvasRef.current : videoRef.current);
    }
  }, [videoSrc, mediaStream, onSourceRef, useWebGL, webGLActive]);

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

  // Dynamic Foveated Pan-Zoom Computation
  const activeRegion = activeFocusedRegion;
  const baseTargetZoom = activeRegion?.zoomLevel || (activeRegion?.type === 'ACTION_ZONE' ? 1.35 : 1.45);
  const effectiveZoomMultiplier = zoomComfortLevel === 'GENTLE' ? 0.85 : (zoomComfortLevel === 'HIGH' ? 1.20 : 1.0);
  const targetZoom = 1.0 + (baseTargetZoom - 1.0) * effectiveZoomMultiplier;

  let currentScale = 1.0;
  let clampedDeltaX = 0;
  let clampedDeltaY = 0;

  if (activeRegion) {
    // Smooth Hermite Cubic Easing: S(p) = 3*p^2 - 2*p^3
    const p = Math.max(0, Math.min(1, dwellProgress));
    const smoothEased = 3 * p * p - 2 * p * p * p;
    currentScale = 1.0 + smoothEased * (targetZoom - 1.0);

    const box = activeRegion.boundingBox;
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;

    const targetPixelX = cx * viewportSize.width;
    const targetPixelY = cy * viewportSize.height;
    const centerPixelX = viewportSize.width / 2;
    const centerPixelY = viewportSize.height / 2;

    // Fractional Contextual Pan: 42% toward screen center to preserve full surrounding context
    const deltaX = (centerPixelX - targetPixelX) * 0.42;
    const deltaY = (centerPixelY - targetPixelY) * 0.42;

    const maxDeltaX = ((currentScale - 1) / 2) * viewportSize.width;
    const maxDeltaY = ((currentScale - 1) / 2) * viewportSize.height;

    clampedDeltaX = Math.max(-maxDeltaX, Math.min(maxDeltaX, deltaX));
    clampedDeltaY = Math.max(-maxDeltaY, Math.min(maxDeltaY, deltaY));
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (inputMode === 'MOUSE_DEBUG' && onMouseMoveSimulate && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;

      let videoX = rawX;
      let videoY = rawY;

      // Invert zoom & translation so pointing at a magnified element maps 1:1 to video coordinates
      if (currentScale > 1.0) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        videoX = centerX + (rawX - centerX - clampedDeltaX) / currentScale;
        videoY = centerY + (rawY - centerY - clampedDeltaY) / currentScale;
        videoX = Math.max(0, Math.min(rect.width, videoX));
        videoY = Math.max(0, Math.min(rect.height, videoY));
      }

      onMouseMoveSimulate(videoX, videoY);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onClick={(e) => {
        if (typeof window !== 'undefined' && (window as any).webgazer && typeof (window as any).webgazer.recordScreenPosition === 'function') {
          try {
            (window as any).webgazer.recordScreenPosition(e.clientX, e.clientY, 'click');
          } catch {}
        }
        // Clicking outside any region resets zoom to full overview
        if (activeRegion && onResetFocus) {
          onResetFocus();
        }
      }}
      className={`relative flex aspect-video h-full w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-black select-none shadow-2xl transition-all duration-200 ${
        hideMouseCursor ? 'cursor-none [&_*]:cursor-none' : 'cursor-crosshair'
      } ${
        isFullscreen ? 'fixed inset-0 z-[99999] w-screen h-screen rounded-none border-0' : ''
      }`}
      style={{
        transform: simulatorActive && (!useWebGL || !webGLActive) ? pathologyTransform.viewportTransform : undefined,
        transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Dynamic Foveated Zoom Stage: Scales and pans the video, canvas, and bounding boxes in lockstep */}
      <div
        className="absolute inset-0 h-full w-full will-change-transform"
        style={{
          transform: `translate(${clampedDeltaX}px, ${clampedDeltaY}px) scale(${currentScale})`,
          transformOrigin: 'center center',
          transition: 'transform 380ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Real HTML5 Video Player (Kept decoded in DOM for continuous 60 FPS WebGL texture updates) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          loop
          muted={isMuted}
          crossOrigin="anonymous"
          className={`absolute inset-0 h-full w-full object-fill transition-opacity duration-150 ${
            useWebGL && webGLActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{
            filter: simulatorActive ? pathologyTransform.canvasFilter : undefined
          }}
        />

        {/* WebGL 2.0 / 1.0 GPU Fragment Shader Canvas */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full object-fill transition-opacity duration-150 ${
            useWebGL && webGLActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Pathology Mask Overlay (Fallback when WebGL is inactive) */}
        {simulatorActive && (!useWebGL || !webGLActive) && pathologyTransform.maskOverlay && (
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background: pathologyTransform.maskOverlay
            }}
            aria-hidden="true"
          />
        )}

        {/* Interactive Semantic Region Bounding Boxes inside the Zoom Stage */}
        <div className="pointer-events-none absolute inset-0 z-20">
          {temporalRegions.map((region) => {
            if (region.type === 'BACKGROUND_CONTEXT') return null;

            const box = region.boundingBox;
            const isFocused = activeFocusedRegion?.id === region.id;

            let borderColor = 'border-amber-400/40 hover:border-amber-400/80';
            let bgColor = isFocused ? 'bg-amber-400/15' : 'bg-transparent hover:bg-amber-400/5';
            let tagBadgeColor = 'bg-amber-400 text-zinc-950';
            let IconComponent = Type;
            let displayBadge = region.label || region.type.replace('_', ' ');

            if (region.type === 'ACTION_ZONE' || region.type === 'ATHLETE_TRACK') {
              borderColor = 'border-amber-400/70 hover:border-amber-400';
              bgColor = isFocused ? 'bg-amber-400/20' : 'bg-transparent hover:bg-amber-400/10';
              tagBadgeColor = 'bg-amber-400 text-zinc-950 font-bold';
              IconComponent = Sparkles;
              displayBadge = region.label || 'ACTION ZONE';
            } else if (region.type === 'FACIAL_PORTRAIT') {
              borderColor = 'border-sky-400/70 hover:border-sky-400';
              bgColor = isFocused ? 'bg-sky-400/20' : 'bg-transparent hover:bg-sky-400/10';
              tagBadgeColor = 'bg-sky-400 text-zinc-950';
              IconComponent = User;
              displayBadge = region.label || 'FACE PORTRAIT';
            } else if (region.type === 'PERSISTENT_HUD') {
              borderColor = 'border-emerald-400/70 hover:border-emerald-400';
              bgColor = isFocused ? 'bg-emerald-400/20' : 'bg-transparent hover:bg-emerald-400/10';
              tagBadgeColor = 'bg-emerald-400 text-zinc-950';
              IconComponent = BarChart2;
              displayBadge = region.label || 'SCOREBOARD';
            } else if (region.type === 'INFOGRAPHIC') {
              borderColor = 'border-purple-400/70 hover:border-purple-400';
              bgColor = isFocused ? 'bg-purple-400/20' : 'bg-transparent hover:bg-purple-400/10';
              tagBadgeColor = 'bg-purple-400 text-zinc-950';
              IconComponent = Layers;
              displayBadge = region.label || 'DIAGRAM';
            }

            return (
              <div
                key={region.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof window !== 'undefined' && (window as any).webgazer && typeof (window as any).webgazer.recordScreenPosition === 'function') {
                    try {
                      (window as any).webgazer.recordScreenPosition(e.clientX, e.clientY, 'click');
                    } catch {}
                  }
                  onRegionDwellComplete(region);
                }}
                className={`group pointer-events-auto absolute cursor-pointer rounded-lg border transition-all duration-150 ${borderColor} ${bgColor} ${
                  isFocused
                    ? 'border-amber-400 ring-2 ring-amber-400/90 ring-offset-2 ring-offset-black shadow-[0_0_40px_rgba(251,191,36,0.6)]'
                    : ''
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
                <div className={`absolute -top-5 left-1 flex items-center gap-1 text-[10px] font-bold shadow-md transition-opacity duration-150 ${
                  isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-mono shadow-sm ${tagBadgeColor}`}>
                    <IconComponent className="h-2.5 w-2.5" />
                    <span>{displayBadge}</span>
                  </span>

                  {/* HUD Pin Action Shortcut */}
                  {region.type === 'PERSISTENT_HUD' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPinHUD(region);
                      }}
                      className="flex items-center gap-1 rounded bg-zinc-950/90 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400 hover:bg-emerald-400 hover:text-black transition border border-emerald-500/30"
                      title="Pin this scoreboard to periphery"
                    >
                      <Pin className="h-2 w-2" />
                      <span>PIN</span>
                    </button>
                  )}
                </div>

                {/* Dwell Progress Shimmer inside bounding box */}
                {isFocused && dwellProgress > 0 && dwellProgress < 1.0 && (
                  <div
                    className="absolute bottom-0 left-0 top-0 bg-amber-400/30 transition-all duration-75"
                    style={{ width: `${dwellProgress * 100}%` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cinematic Component Isolation Spotlight (Dims periphery outside the focused entity) */}
      {activeRegion && currentScale > 1.15 && (
        <div
          className="pointer-events-none absolute inset-0 z-25 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.0) 25%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.85) 100%)'
          }}
          aria-hidden="true"
        />
      )}

      {/* Active Assistive Lens Status Floating Pill (Top Left) */}
      {activeRegion && currentScale > 1.15 && (
        <div className="pointer-events-auto absolute top-3 left-3 z-30 flex items-center gap-2 rounded-xl bg-zinc-950/90 border border-amber-500/50 px-3 py-1.5 backdrop-blur-md shadow-2xl">
          <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="font-mono text-[11px] font-bold text-zinc-100 truncate max-w-[200px] sm:max-w-xs">
              {activeRegion.label || activeRegion.textContent || 'Component Focused'}
            </span>
            <span className="font-mono text-[9px] text-amber-300">
              {currentScale.toFixed(1)}x Foveated Optical Magnification
            </span>
          </div>
          {onResetFocus && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResetFocus();
              }}
              className="ml-2 flex items-center gap-1 rounded-md bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-[10px] font-mono text-zinc-200 hover:text-white transition border border-zinc-700"
              title="Reset Zoom to Full Broadcast Overview (Esc)"
            >
              <Minimize2 className="h-3 w-3" />
              <span>Overview</span>
            </button>
          )}
        </div>
      )}

      {/* Pinned Peripheral HUD Overlay (Top Right) */}
      {pinnedHUDRegions && pinnedHUDRegions.length > 0 && (
        <div className="pointer-events-auto absolute top-3 right-3 z-30 flex flex-col gap-2 max-w-xs">
          {pinnedHUDRegions.map((hud) => (
            <div
              key={hud.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/50 bg-zinc-950/95 px-3 py-2 shadow-2xl backdrop-blur-md"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-400 uppercase">
                  <BarChart2 className="h-3 w-3" />
                  <span>PINNED PERIPHERAL HUD</span>
                </div>
                <div className="text-xs font-bold text-zinc-100 font-mono tracking-wide">
                  {hud.textContent}
                </div>
              </div>
              {onUnpinHUD && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnpinHUD(hud.id);
                  }}
                  className="rounded bg-zinc-800 hover:bg-zinc-700 p-1 text-zinc-400 hover:text-zinc-200 transition text-[10px]"
                  title="Unpin HUD"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Active Floating Badge */}
      {isFullscreen && (
        <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-zinc-950/90 border border-amber-400/40 px-4 py-1 text-[11px] font-mono text-zinc-300 backdrop-blur-md shadow-2xl animate-fade-in">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span>FocalPoint Fullscreen Broadcast</span>
          <span className="text-zinc-500">|</span>
          <span className="text-amber-300">Esc or F to Exit</span>
        </div>
      )}

      {/* Live Webcam Picture-in-Picture Feed (Persists in Fullscreen) */}
      <WebcamPip
        isActive={isWebcamActive}
        onClose={onToggleWebcam}
        inputMode={inputMode}
      />

      {/* Video Overlay Playback & Demo Controls */}
      <div className="pointer-events-auto absolute bottom-3 right-3 z-30 flex items-center gap-1.5 rounded-lg bg-zinc-950/85 px-2.5 py-1 text-xs text-zinc-300 backdrop-blur-md border border-zinc-800/80 shadow-2xl">
        {/* Live Cam PIP Toggle Button */}
        {onToggleWebcam && (
          <button
            onClick={onToggleWebcam}
            className={`flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] font-semibold transition ${
              isWebcamActive 
                ? 'bg-amber-400 text-zinc-950 shadow-sm font-bold' 
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle Live Webcam Picture-in-Picture (Shortcut: W)"
          >
            {isWebcamActive ? <Camera className="h-3 w-3" /> : <CameraOff className="h-3 w-3" />}
            <span>{isWebcamActive ? 'Live Cam ON' : 'Live Cam'}</span>
          </button>
        )}

        {/* Hide Mouse Cursor Toggle Button */}
        {onToggleHideCursor && (
          <button
            onClick={onToggleHideCursor}
            className={`flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] font-semibold transition ${
              hideMouseCursor 
                ? 'bg-sky-500 text-zinc-950 shadow-sm font-bold' 
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Hide system mouse pointer for recording (Shortcut: C)"
          >
            {hideMouseCursor ? <MouseOff className="h-3 w-3" /> : <MousePointer className="h-3 w-3" />}
            <span>{hideMouseCursor ? 'Cursor Hidden' : 'Cursor Show'}</span>
          </button>
        )}

        {/* Fullscreen Mode Toggle Button */}
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] font-semibold bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 transition border border-zinc-800/60"
          title={isFullscreen ? "Exit Fullscreen (F / Esc)" : "Enter Fullscreen Mode (F)"}
        >
          {isFullscreen ? <Minimize2 className="h-3 w-3 text-amber-400" /> : <Maximize className="h-3 w-3 text-amber-400" />}
          <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>

        <div className="h-3.5 w-px bg-zinc-800 my-auto" />

        <button
          onClick={() => setUseWebGL(prev => !prev)}
          className={`flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] font-semibold transition ${
            useWebGL && webGLActive 
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80' 
              : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
          }`}
          title="Toggle WebGL GPU Fragment Shader Pipeline"
        >
          <Cpu className="h-3 w-3 text-amber-400" />
          <span>{useWebGL && webGLActive ? 'GPU' : 'CSS'}</span>
        </button>

        <button
          onClick={togglePlay}
          className="rounded px-2 py-0.5 text-[11px] font-medium hover:bg-zinc-800 transition text-zinc-300 hover:text-zinc-100"
          title={isPlaying ? "Pause video" : "Play video"}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={toggleMute}
          className="rounded px-2 py-0.5 text-[11px] font-medium hover:bg-zinc-800 transition text-zinc-300 hover:text-zinc-100"
          title={isMuted ? "Unmute audio" : "Mute audio"}
        >
          {isMuted ? 'Unmute' : 'Mute'}
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
