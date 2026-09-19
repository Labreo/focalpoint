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
import { Pin, Type, User, BarChart2, Cpu, Sparkles } from 'lucide-react';

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
  inputMode?: 'EYE_TRACKER' | 'MOUSE_DEBUG';
  onMouseMoveSimulate?: (x: number, y: number) => void;
  onSourceRef?: (source: HTMLVideoElement | HTMLCanvasElement | null) => void;
  onContainerRectChange?: (rect: DOMRect) => void;
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
  inputMode = 'EYE_TRACKER',
  onMouseMoveSimulate,
  onSourceRef,
  onContainerRectChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pipelineRef = useRef<WebGLShaderPipeline | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [useWebGL, setUseWebGL] = useState<boolean>(true);
  const [webGLActive, setWebGLActive] = useState<boolean>(false);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({ width: 1280, height: 720 });

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

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [useWebGL, webGLActive, activePathology, gazePoint, viewportSize, simulatorActive]);

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

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (inputMode === 'MOUSE_DEBUG' && onMouseMoveSimulate && containerRef.current) {
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
        transform: simulatorActive && (!useWebGL || !webGLActive) ? pathologyTransform.viewportTransform : undefined,
        transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)'
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
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-150 ${
          useWebGL && webGLActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{
          filter: simulatorActive ? pathologyTransform.canvasFilter : undefined
        }}
      />

      {/* WebGL 2.0 / 1.0 GPU Fragment Shader Canvas (Anamorphic Radial Compression, 3x3 Laplacian Sharpening, Gaussian Scotoma) */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-150 ${
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

      {/* Interactive Semantic Region Bounding Boxes */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {semanticRegions.map((region) => {
          if (region.type === 'BACKGROUND_CONTEXT') return null;

          const box = region.boundingBox;
          const isFocused = activeFocusedRegion?.id === region.id;

          let borderColor = 'border-amber-400/40 hover:border-amber-400/80';
          let bgColor = isFocused ? 'bg-amber-400/10' : 'bg-transparent hover:bg-amber-400/5';
          let tagBadgeColor = 'bg-amber-400 text-zinc-950';
          let IconComponent = Type;

          if (region.type === 'FACIAL_PORTRAIT') {
            borderColor = 'border-sky-400/40 hover:border-sky-400/80';
            bgColor = isFocused ? 'bg-sky-400/10' : 'bg-transparent hover:bg-sky-400/5';
            tagBadgeColor = 'bg-sky-400 text-zinc-950';
            IconComponent = User;
          } else if (region.type === 'PERSISTENT_HUD') {
            borderColor = 'border-emerald-400/50 hover:border-emerald-400/90';
            bgColor = isFocused ? 'bg-emerald-400/10' : 'bg-transparent hover:bg-emerald-400/5';
            tagBadgeColor = 'bg-emerald-400 text-zinc-950';
            IconComponent = BarChart2;
          }

          return (
            <div
              key={region.id}
              onClick={() => onRegionDwellComplete(region)}
              className={`group pointer-events-auto absolute cursor-pointer rounded-lg border transition-all duration-150 ${borderColor} ${bgColor} ${
                isFocused
                  ? 'border-amber-400 ring-2 ring-amber-400/60 ring-offset-2 ring-offset-black shadow-xl'
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
              {/* Semantic Tag Header (Visible on focus or hover) */}
              <div className={`absolute -top-5 left-1 flex items-center gap-1 text-[10px] font-bold shadow-md transition-opacity duration-150 ${
                isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-mono ${tagBadgeColor}`}>
                  <IconComponent className="h-2.5 w-2.5" />
                  <span>{region.type === 'PERSISTENT_HUD' ? 'SCOREBOARD' : region.type.replace('_', ' ')}</span>
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
              {isFocused && dwellProgress > 0 && (
                <div
                  className="absolute bottom-0 left-0 top-0 bg-amber-400/25 transition-all duration-75"
                  style={{ width: `${dwellProgress * 100}%` }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Video Overlay Playback Controls */}
      <div className="pointer-events-auto absolute bottom-3 right-3 z-30 flex items-center gap-1.5 rounded-lg bg-zinc-950/80 px-2 py-1 text-xs text-zinc-300 backdrop-blur-md border border-zinc-800/80 shadow-lg">
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
          <span>{useWebGL && webGLActive ? 'GPU Shader ON' : 'GPU Shader OFF'}</span>
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
