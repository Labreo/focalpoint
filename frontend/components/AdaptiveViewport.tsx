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
      {/* Real HTML5 Video Player (Serves as WebGL Texture Source or Fallback Renderer) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        loop
        muted={isMuted}
        crossOrigin="anonymous"
        className={`h-full w-full object-contain ${useWebGL && webGLActive ? 'hidden' : 'block'}`}
        style={{
          filter: simulatorActive ? pathologyTransform.canvasFilter : undefined
        }}
      />

      {/* WebGL 2.0 / 1.0 GPU Fragment Shader Canvas (Anamorphic Radial Compression, 3x3 Laplacian Sharpening, Gaussian Scotoma) */}
      <canvas
        ref={canvasRef}
        className={`h-full w-full object-contain ${useWebGL && webGLActive ? 'block' : 'hidden'}`}
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
      <div className="pointer-events-auto absolute bottom-3 right-3 z-30 flex items-center gap-2 rounded-lg bg-black/80 px-2.5 py-1.5 text-xs text-white backdrop-blur-md border border-white/10">
        <button
          onClick={() => setUseWebGL(prev => !prev)}
          className={`flex items-center gap-1 rounded px-2 py-1 font-mono text-[11px] font-bold transition ${
            useWebGL && webGLActive 
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' 
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
          title="Toggle WebGL GPU Fragment Shader Pipeline"
        >
          <Cpu className="h-3 w-3" />
          <span>{useWebGL && webGLActive ? 'GPU Shader: ON' : 'GPU Shader: OFF'}</span>
        </button>

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
