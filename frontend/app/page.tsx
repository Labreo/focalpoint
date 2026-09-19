'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  SemanticRegion, 
  PathologyConfig, 
  KinematicState, 
  ContrastPreset, 
  DemoScene,
  StreamMode
} from '../types';
import { DEMO_SCENES } from '../lib/demo_scenes';
import { GazeKalmanFilter2D } from '../lib/kalman_filter';
import { KinematicIntentClassifier } from '../lib/eye_kinematics';
import { audioHaptics } from '../lib/synthetic_audio';
import { webGazerManager } from '../lib/webgazer_adapter';
import { focalPointClient } from '../lib/aws_client';
import { TemporalDifferentialEngine } from '../lib/differential_engine';
import { AdaptiveViewport } from '../components/AdaptiveViewport';
import { 
  Volume2, 
  Sparkles, 
  Cloud, 
  Database, 
  Upload, 
  Eye, 
  Crosshair, 
  Zap,
  Layers
} from 'lucide-react';

const DEFAULT_PATHOLOGY: PathologyConfig = {
  type: 'AMD',
  description: 'Age-Related Macular Degeneration (Central Scotoma)',
  dwellThresholdMs: 280,
  maxDispersionPx: 65,
  preferredContrastTheme: 'AMBER',
  fontScaleRem: 2.2,
  prlOffset: { x: 120, y: -80 },
  scotomaRadiusPx: 110,
  tunnelRadiusPx: 220,
  audioHapticEnabled: true
};

export default function AdaptiveViewerPage() {
  // Media Stream & Video Source State (Defaults to AWS Serverless Course)
  const [streamMode, setStreamMode] = useState<StreamMode>('AWS_SERVERLESS');
  const [videoSrc, setVideoSrc] = useState<string | null>(DEMO_SCENES[0].videoUrl || '/videos/aws_serverless.mp4');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [currentDemoScene, setCurrentDemoScene] = useState<DemoScene | null>(DEMO_SCENES[0]);
  const [semanticRegions, setSemanticRegions] = useState<SemanticRegion[]>(DEMO_SCENES[0].regions);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ophthalmic & Visual Configuration
  const [pathologyConfig, setPathologyConfig] = useState<PathologyConfig>(DEFAULT_PATHOLOGY);
  const [contrastPreset, setContrastPreset] = useState<ContrastPreset>('AMBER');
  const [simulatorActive, setSimulatorActive] = useState<boolean>(false);

  // Eye Kinematics & Tracking State
  const [rawGaze, setRawGaze] = useState<{ x: number; y: number }>({ x: 600, y: 400 });
  const [smoothedGaze, setSmoothedGaze] = useState<{ x: number; y: number }>({ x: 600, y: 400 });
  const [kinematicState, setKinematicState] = useState<KinematicState>('SACCADE');
  const [dwellProgress, setDwellProgress] = useState<number>(0);
  const [activeFocusedRegion, setActiveFocusedRegion] = useState<SemanticRegion | null>(null);
  const [inputMode, setInputMode] = useState<'EYE_TRACKER' | 'MOUSE_DEBUG'>('MOUSE_DEBUG');
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const [isWebGazerActive, setIsWebGazerActive] = useState<boolean>(false);

  // Pinned Peripheral HUD regions
  const [pinnedHUDRegions, setPinnedHUDRegions] = useState<SemanticRegion[]>([]);

  // Telemetry & Audio Speech Synthesis
  const [awsLatencyMs, setAwsLatencyMs] = useState<number>(653);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [lastSyncReason, setLastSyncReason] = useState<string>('AWS Reference Pipeline Ready');
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Math references (persist across renders)
  const kalmanFilterRef = useRef<GazeKalmanFilter2D>(new GazeKalmanFilter2D(0.08, 18.0));
  const intentClassifierRef = useRef<KinematicIntentClassifier>(
    new KinematicIntentClassifier(DEFAULT_PATHOLOGY.dwellThresholdMs, DEFAULT_PATHOLOGY.maxDispersionPx)
  );
  const diffEngineRef = useRef<TemporalDifferentialEngine>(new TemporalDifferentialEngine(0.12, 6000));
  const lastAutoAnalysisTimeRef = useRef<number>(0);
  const lastLockedRegionIdRef = useRef<string | null>(null);
  const activeVideoRef = useRef<HTMLVideoElement | HTMLCanvasElement | null>(null);
  const viewportRectRef = useRef<DOMRect | null>(null);

  // Hydrate user profile from DynamoDB on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const p = await focalPointClient.getProfile('usr_kanak_001');
        if (p) {
          setPathologyConfig(p);
          if (p.preferredContrastTheme) {
            setContrastPreset(p.preferredContrastTheme);
          }
        }
      } catch (e) {
        console.warn('Profile load notice:', e);
      }
    };
    loadProfile();
    setIsCalibrated(webGazerManager.isCalibrated());
  }, []);

  // Handle Stream Mode Switch
  const handleSelectStreamMode = (mode: StreamMode, customFile?: File, customUrl?: string) => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }

    setStreamMode(mode);
    setActiveFocusedRegion(null);

    if (mode === 'AWS_SERVERLESS') {
      const scene = DEMO_SCENES.find(s => s.id === 'aws-serverless') || DEMO_SCENES[0];
      setVideoSrc(scene.videoUrl || '/videos/aws_serverless.mp4');
      setCurrentDemoScene(scene);
      setSemanticRegions(scene.regions);
    } else if (mode === 'DEMO_CRICKET') {
      const scene = DEMO_SCENES.find(s => s.id === 'cricket-match') || DEMO_SCENES[1];
      setVideoSrc(scene.videoUrl || '/videos/cricket.mp4');
      setCurrentDemoScene(scene);
      setSemanticRegions(scene.regions);
    } else if (mode === 'DEMO_LECTURE') {
      const scene = DEMO_SCENES.find(s => s.id === 'academic-lecture') || DEMO_SCENES[2];
      setVideoSrc(scene.videoUrl || '/videos/lecture.mp4');
      setCurrentDemoScene(scene);
      setSemanticRegions(scene.regions);
    } else if (mode === 'DEMO_NEWS') {
      const scene = DEMO_SCENES.find(s => s.id === 'global-news') || DEMO_SCENES[3];
      setVideoSrc(scene.videoUrl || '/videos/news.mp4');
      setCurrentDemoScene(scene);
      setSemanticRegions(scene.regions);
    } else if (mode === 'CUSTOM_UPLOAD' && customFile) {
      const url = URL.createObjectURL(customFile);
      setVideoSrc(url);
      setCurrentDemoScene(null);
      setSemanticRegions([
        {
          id: 'custom_video_scan',
          type: 'ACTION_ZONE',
          confidence: 0.99,
          boundingBox: { left: 0.10, top: 0.20, width: 0.80, height: 0.60 },
          label: `Uploaded: ${customFile.name}`,
          textContent: `Inspecting ${customFile.name} with Amazon Rekognition OCR. Direct gaze or cursor here to zoom.`,
          zoomLevel: 2.4,
          adaptationStrategy: { action: 'FOVEATED_OPTICAL_ZOOM', zoomLevel: 2.4 }
        }
      ]);
      setTimeout(() => {
        handleTriggerAwsAnalysis('INITIAL_FRAME', 1.0);
      }, 500);
    } else if (mode === 'YOUTUBE_URL' && customUrl) {
      setVideoSrc(customUrl);
      setCurrentDemoScene(null);
      setSemanticRegions([
        {
          id: 'custom_url_target',
          type: 'ACTION_ZONE',
          confidence: 0.99,
          boundingBox: { left: 0.15, top: 0.25, width: 0.70, height: 0.50 },
          label: 'External Video Feed',
          textContent: `Active stream from ${customUrl.slice(0, 45)}... Direct gaze to magnify.`,
          zoomLevel: 2.4,
          adaptationStrategy: { action: 'FOVEATED_OPTICAL_ZOOM', zoomLevel: 2.4 }
        }
      ]);
      setTimeout(() => {
        handleTriggerAwsAnalysis('INITIAL_FRAME', 1.0);
      }, 500);
    }
  };

  // Process Gaze Coordinate in Video-Relative Space (One-Shot Lock Chime)
  const handleProcessViewportGaze = useCallback((videoX: number, videoY: number, containerW: number, containerH: number) => {
    const t0 = performance.now();

    // 1. Smooth via 2D Discrete Kalman Filter
    const smoothed = kalmanFilterRef.current.update(videoX, videoY, t0);
    setSmoothedGaze({ x: smoothed.x, y: smoothed.y });

    // 2. Classify via I-VDT State Machine using container dimensions
    const classification = intentClassifierRef.current.processPoint(
      smoothed,
      semanticRegions,
      containerW,
      containerH,
      t0
    );

    setKinematicState(classification.state);
    setDwellProgress(classification.dwellProgress);
    setActiveFocusedRegion(classification.activeRegion);

    // 3. Trigger Lock Chime ONLY ONCE on dwell completion (prevent continuous 880Hz audio drone!)
    if (classification.dwellProgress >= 1.0 && classification.activeRegion) {
      if (lastLockedRegionIdRef.current !== classification.activeRegion.id) {
        lastLockedRegionIdRef.current = classification.activeRegion.id;
        audioHaptics.playLockChime();
      }
    } else if (classification.dwellProgress === 0) {
      lastLockedRegionIdRef.current = null;
    }
  }, [semanticRegions]);

  // Screen-to-Viewport coordinate mapper for genuine webcam eye tracking
  const handleProcessScreenGaze = useCallback((screenX: number, screenY: number) => {
    const rect = viewportRectRef.current;
    if (!rect || rect.width === 0 || rect.height === 0) {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const h = typeof window !== 'undefined' ? window.innerHeight : 720;
      handleProcessViewportGaze(screenX, screenY, w, h);
      return;
    }

    const videoX = Math.max(0, Math.min(rect.width, screenX - rect.left));
    const videoY = Math.max(0, Math.min(rect.height, screenY - rect.top));
    handleProcessViewportGaze(videoX, videoY, rect.width, rect.height);
  }, [handleProcessViewportGaze]);

  // Mouse Simulation Pointer (active in MOUSE_DEBUG mode)
  const handleMouseMoveSimulate = (videoX: number, videoY: number) => {
    if (inputMode !== 'MOUSE_DEBUG') return;
    const rect = viewportRectRef.current;
    const w = rect ? rect.width : (typeof window !== 'undefined' ? window.innerWidth : 1280);
    const h = rect ? rect.height : (typeof window !== 'undefined' ? window.innerHeight : 720);
    setRawGaze({ x: videoX, y: videoY });
    handleProcessViewportGaze(videoX, videoY, w, h);
  };

  // Toggle WebGazer Live Eye Tracking
  const handleToggleWebGazer = async () => {
    if (isWebGazerActive) {
      webGazerManager.pause();
      setIsWebGazerActive(false);
    } else {
      try {
        const initialized = await webGazerManager.init();
        if (initialized) {
          const started = await webGazerManager.start((screenX, screenY) => {
            if (inputMode === 'EYE_TRACKER') {
              setRawGaze({ x: screenX, y: screenY });
              handleProcessScreenGaze(screenX, screenY);
            }
          }, true);
          if (started) {
            setIsWebGazerActive(true);
            webGazerManager.showCameraPreview(true);
            webGazerManager.styleCameraElements();
          }
        }
      } catch (err) {
        console.warn('Failed to start WebGazer:', err);
        setIsWebGazerActive(false);
      }
    }
  };

  const handleToggleInputMode = () => {
    const nextMode = inputMode === 'EYE_TRACKER' ? 'MOUSE_DEBUG' : 'EYE_TRACKER';
    setInputMode(nextMode);
    if (nextMode === 'EYE_TRACKER' && !isWebGazerActive) {
      handleToggleWebGazer();
    }
  };

  // Dispatches a frame to AWS Lambda Orchestrator
  const handleTriggerAwsAnalysis = useCallback(async (triggerReason: string = 'manual_inspection', deltaValue: number = 0.15) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    const t0 = performance.now();

    try {
      const video = activeVideoRef.current;
      let width = 1280;
      let height = 720;
      let base64Jpeg = '';

      if (video instanceof HTMLVideoElement && video.videoWidth > 0) {
        width = video.videoWidth;
        height = video.videoHeight;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          base64Jpeg = tempCanvas.toDataURL('image/jpeg', 0.85).split(',')[1] || '';
        }
      } else if (video instanceof HTMLCanvasElement && video.width > 0) {
        width = video.width;
        height = video.height;
        base64Jpeg = video.toDataURL('image/jpeg', 0.85).split(',')[1] || '';
      }

      if (base64Jpeg) {
        const result = await focalPointClient.analyzeFrame(
          base64Jpeg,
          width,
          height,
          'usr_kanak_001',
          triggerReason
        );

        if (result.regions && result.regions.length > 0) {
          // If user is dwelling or focused, preserve active region identity
          setSemanticRegions(prev => {
            if (activeFocusedRegion !== null || dwellProgress > 0) {
              const hasActive = result.regions.some((r: SemanticRegion) => r.id === activeFocusedRegion?.id);
              if (!hasActive && activeFocusedRegion) {
                return [...result.regions, activeFocusedRegion];
              }
            }
            return result.regions;
          });
        }
        setAwsLatencyMs(result.processingLatencyMs || Math.round(performance.now() - t0));
        setLastSyncReason(`AWS Rekognition Refined (${result.regions.length} entities in ${result.processingLatencyMs || Math.round(performance.now() - t0)}ms)`);
      }
    } catch (err) {
      console.warn('AWS Analysis invocation error:', err);
      setAwsLatencyMs(Math.round(performance.now() - t0));
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, activeFocusedRegion, dwellProgress]);

  // Edge-Computed Temporal Differential Loop (6-second cooldown, protects active dwell)
  useEffect(() => {
    const interval = setInterval(() => {
      const source = activeVideoRef.current;
      // Do not interrupt while user is actively accumulating dwell progress!
      if (!source || isAnalyzing || (dwellProgress > 0 && dwellProgress < 1.0)) return;

      if (source instanceof HTMLVideoElement) {
        if (source.paused || source.ended || source.readyState < 2) return;
      }

      const now = performance.now();
      if (now - lastAutoAnalysisTimeRef.current < 6000) return;

      const evalResult = diffEngineRef.current.evaluateFrame(source);
      if (evalResult.shouldAnalyze) {
        lastAutoAnalysisTimeRef.current = now;
        handleTriggerAwsAnalysis(evalResult.reason, evalResult.delta);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [isAnalyzing, dwellProgress, handleTriggerAwsAnalysis]);

  // Neural Speech Synthesis using Amazon Polly
  const handleSpeakText = async (text?: string) => {
    if (!text || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const audioB64 = await focalPointClient.synthesizeSpeech(text, 'Joanna');
      if (audioB64) {
        const audioUrl = `data:audio/mp3;base64,${audioB64}`;
        if (!audioPlayerRef.current) {
          audioPlayerRef.current = new Audio();
        }
        audioPlayerRef.current.src = audioUrl;
        audioPlayerRef.current.onended = () => setIsSpeaking(false);
        audioPlayerRef.current.onerror = () => setIsSpeaking(false);
        await audioPlayerRef.current.play();
      } else {
        // Transparent fallback to Web Speech API if offline
        if ('speechSynthesis' in window) {
          const utter = new SpeechSynthesisUtterance(text);
          utter.onend = () => setIsSpeaking(false);
          utter.onerror = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utter);
        } else {
          setIsSpeaking(false);
        }
      }
    } catch (err) {
      console.warn('Amazon Polly playback error:', err);
      setIsSpeaking(false);
    }
  };

  // Keyboard Shortcuts for Instant Demo Control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        setActiveFocusedRegion(null);
      } else if (e.key === '1') {
        handleSelectStreamMode('AWS_SERVERLESS');
      } else if (e.key === '2') {
        handleSelectStreamMode('DEMO_LECTURE');
      } else if (e.key === '3') {
        handleSelectStreamMode('DEMO_CRICKET');
      } else if (e.key === '4') {
        handleSelectStreamMode('DEMO_NEWS');
      } else if (e.key === ' ' && activeFocusedRegion) {
        e.preventDefault();
        handleSpeakText(activeFocusedRegion.textContent || activeFocusedRegion.label);
      } else if (e.key.toLowerCase() === 'm') {
        handleToggleInputMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFocusedRegion]);

  return (
    <div className="crt bg-grid bg-fixed min-h-screen text-zinc-100 flex flex-col items-center py-6 px-3 sm:px-6">
      {/* Centered Deltea-Inspired Container (max-w-5xl) */}
      <main className="w-full max-w-5xl flex flex-col items-center">
        
        {/* Header Ribbon with Deltea Retro Aesthetics */}
        <header className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-amber-400 text-zinc-950 flex items-center justify-center font-mono font-bold text-xl shadow-[0_0_20px_rgba(251,191,36,0.3)]">
              FP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-2xl tracking-tight text-zinc-50 font-mono">
                  @focalpoint
                </h1>
                <span className="rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono px-1.5 py-0.5 font-semibold uppercase tracking-wider">
                  AWS Ship It Track
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Intent-aware assistive foveated vision for low-vision developers watching cloud lectures
              </p>
            </div>
          </div>

          {/* Social / Verified Links */}
          <div className="flex items-center gap-3 font-mono text-xs text-zinc-400">
            <a 
              href="https://github.com/Labreo/focalpoint" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-amber-300 transition flex items-center gap-1 hover:underline"
            >
              <span>💾 github</span>
            </a>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>live on aws</span>
            </span>
          </div>
        </header>

        {/* Spiky Sawtooth Divider */}
        <div 
          className="w-full bg-contain bg-repeat-x h-3 my-2 opacity-60" 
          style={{ backgroundImage: "url('/spiky-divider.svg')" }} 
        />

        {/* Video Source Selector Bar: Input + Preset Chips */}
        <section className="w-full flex flex-col gap-3 py-2">
          {/* Custom URL or File Input Bar */}
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <input
                type="text"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customUrlInput) {
                    handleSelectStreamMode('YOUTUBE_URL', undefined, customUrlInput);
                  }
                }}
                placeholder="Paste any video URL or AWS course link..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3.5 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
              />
            </div>
            <button
              onClick={() => {
                if (customUrlInput) {
                  handleSelectStreamMode('YOUTUBE_URL', undefined, customUrlInput);
                }
              }}
              className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2 text-xs font-mono font-semibold border border-zinc-700 transition"
            >
              Load URL
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="video/mp4,video/webm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleSelectStreamMode('CUSTOM_UPLOAD', file);
                }
              }}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-3 py-2 text-xs font-mono border border-zinc-800 transition cursor-pointer"
              title="Upload custom MP4/WebM video"
            >
              <Upload className="size-3.5 text-amber-400" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          </div>

          {/* Instant Preset Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-zinc-500 text-[11px]">PRESETS:</span>
            <button
              onClick={() => handleSelectStreamMode('AWS_SERVERLESS')}
              className={`rounded-md px-2.5 py-1 text-xs transition border flex items-center gap-1.5 cursor-pointer ${
                streamMode === 'AWS_SERVERLESS'
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/60 font-bold'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <Cloud className="size-3 text-amber-400" />
              <span>AWS Serverless Deep Dive</span>
            </button>

            <button
              onClick={() => handleSelectStreamMode('DEMO_LECTURE')}
              className={`rounded-md px-2.5 py-1 text-xs transition border flex items-center gap-1.5 cursor-pointer ${
                streamMode === 'DEMO_LECTURE'
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/60 font-bold'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <Layers className="size-3 text-sky-400" />
              <span>CS Deep Learning</span>
            </button>

            <button
              onClick={() => handleSelectStreamMode('DEMO_CRICKET')}
              className={`rounded-md px-2.5 py-1 text-xs transition border flex items-center gap-1.5 cursor-pointer ${
                streamMode === 'DEMO_CRICKET'
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/60 font-bold'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <span>🏏 Cricket Telemetry</span>
            </button>

            <button
              onClick={() => handleSelectStreamMode('DEMO_NEWS')}
              className={`rounded-md px-2.5 py-1 text-xs transition border flex items-center gap-1.5 cursor-pointer ${
                streamMode === 'DEMO_NEWS'
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/60 font-bold'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <span>📺 Global News</span>
            </button>
          </div>
        </section>

        {/* Main Stage: High-Contrast 16:9 Adaptive Viewport (Deltea Monitor Frame) */}
        <div className="w-full my-3">
          <div className="relative aspect-video w-full max-h-[72vh] mx-auto overflow-hidden rounded-2xl border-2 border-zinc-700/80 bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <AdaptiveViewport
              videoSrc={videoSrc}
              mediaStream={mediaStream}
              demoScene={currentDemoScene}
              semanticRegions={semanticRegions}
              activePathology={pathologyConfig}
              gazePoint={smoothedGaze}
              kinematicState={kinematicState}
              dwellProgress={dwellProgress}
              activeFocusedRegion={activeFocusedRegion}
              onRegionDwellComplete={(region) => {
                setActiveFocusedRegion(region);
                if (lastLockedRegionIdRef.current !== region.id) {
                  lastLockedRegionIdRef.current = region.id;
                  audioHaptics.playLockChime();
                }
              }}
              onPinHUD={(region) => {
                if (!pinnedHUDRegions.some(r => r.id === region.id)) {
                  setPinnedHUDRegions(prev => [...prev, region]);
                  audioHaptics.playLockChime();
                }
              }}
              onResetFocus={() => setActiveFocusedRegion(null)}
              pinnedHUDRegions={pinnedHUDRegions}
              onUnpinHUD={(id) => setPinnedHUDRegions(prev => prev.filter(r => r.id !== id))}
              isFrozen={false}
              simulatorActive={simulatorActive}
              inputMode={inputMode}
              onContainerRectChange={(rect) => { viewportRectRef.current = rect; }}
              onMouseMoveSimulate={handleMouseMoveSimulate}
              onSourceRef={(source) => { activeVideoRef.current = source; }}
            />
          </div>
        </div>

        {/* Action Dock: Focused Component Card + Polly Speech Button + Ophthalmic Controls */}
        <section className="w-full flex flex-col gap-3.5 mt-2">
          {/* Active Focused Component Card */}
          <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 backdrop-blur-md shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded bg-amber-400 text-zinc-950 text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider">
                  {activeFocusedRegion ? (activeFocusedRegion.label || activeFocusedRegion.type.replace('_', ' ')) : 'Foveal Focus Ready'}
                </span>
                <span className="font-mono text-[11px] text-zinc-500">
                  {activeFocusedRegion ? `${activeFocusedRegion.zoomLevel || 2.4}x Optical Push-in` : 'Direct cursor or gaze to magnify'}
                </span>
              </div>
              <p className="text-sm font-sans text-zinc-200 leading-relaxed">
                {activeFocusedRegion 
                  ? activeFocusedRegion.textContent 
                  : 'Hover over or gaze at any architectural component (DynamoDB, Lambda, API Gateway) to smoothly magnify and isolate it.'}
              </p>
            </div>

            {/* Actions: Speak with Amazon Polly + Reset Zoom */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              {activeFocusedRegion && (
                <button
                  onClick={() => handleSpeakText(activeFocusedRegion.textContent || activeFocusedRegion.label)}
                  disabled={isSpeaking}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-mono font-bold transition shadow-md cursor-pointer ${
                    isSpeaking 
                      ? 'bg-amber-400 text-zinc-950 animate-pulse'
                      : 'bg-amber-400 hover:bg-amber-300 text-zinc-950 hover:shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                  }`}
                  title="Synthesize and speak text via Amazon Polly (Neural Voice)"
                >
                  <Volume2 className="size-4" />
                  <span>{isSpeaking ? 'Speaking...' : 'Read Aloud (AWS Polly)'}</span>
                </button>
              )}

              {activeFocusedRegion && (
                <button
                  onClick={() => setActiveFocusedRegion(null)}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-3 py-2 text-xs font-mono transition cursor-pointer"
                  title="Reset zoom back to wide broadcast (Esc)"
                >
                  Reset (Esc)
                </button>
              )}
            </div>
          </div>

          {/* Quick Ergonomic Controls Toolbar */}
          <div className="w-full flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-2.5 text-xs font-mono">
            {/* Left: Input Mode & Tracking Status */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleToggleInputMode}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition border flex items-center gap-1.5 cursor-pointer ${
                  inputMode === 'MOUSE_DEBUG'
                    ? 'bg-sky-400/15 text-sky-300 border-sky-400/40'
                    : isWebGazerActive
                      ? 'bg-emerald-400/15 text-emerald-300 border-emerald-400/40'
                      : 'bg-amber-400/15 text-amber-300 border-amber-400/40'
                }`}
              >
                {inputMode === 'MOUSE_DEBUG' ? (
                  <>
                    <Crosshair className="size-3 text-sky-400" />
                    <span>🖱️ Assistive Cursor</span>
                  </>
                ) : (
                  <>
                    <Eye className="size-3 text-emerald-400" />
                    <span>👁️ Webcam Iris ({isWebGazerActive ? 'Active' : 'Off'})</span>
                  </>
                )}
              </button>

              <span className="text-zinc-500">|</span>

              <span className="text-zinc-400 text-[11px]">
                Dwell: <strong className="text-amber-400">{Math.round(dwellProgress * 100)}%</strong>
              </span>
            </div>

            {/* Center: Ophthalmic Clinical Mode */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 text-[11px]">CLINICAL:</span>
              <button
                onClick={() => setSimulatorActive(p => !p)}
                className={`rounded px-2 py-0.5 text-[11px] transition border cursor-pointer ${
                  simulatorActive
                    ? 'bg-amber-400 text-zinc-950 font-bold border-amber-400'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                {simulatorActive ? '● AMD Scotoma Active' : '○ Standard View'}
              </button>
            </div>

            {/* Right: High-Contrast Color Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 text-[11px]">CONTRAST:</span>
              {(['AMBER', 'CYAN', 'MINT', 'INVERT'] as ContrastPreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setContrastPreset(preset)}
                  className={`rounded px-2 py-0.5 text-[10px] transition font-bold border cursor-pointer ${
                    contrastPreset === preset
                      ? 'border-zinc-100 bg-zinc-100 text-zinc-950'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Spiky Sawtooth Divider */}
        <div 
          className="w-full bg-contain bg-repeat-x h-3 my-4 opacity-60" 
          style={{ backgroundImage: "url('/spiky-divider.svg')" }} 
        />

        {/* AWS Architecture & Live Cloud Verification Card */}
        <section className="w-full rounded-xl border border-zinc-800/90 bg-zinc-950/90 p-4 font-mono text-xs shadow-md">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <Cloud className="size-4 text-amber-400" />
              <span className="font-bold text-zinc-200 tracking-wide">AWS Cloud Architecture Status</span>
              <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-1.5 py-0.2">
                200 OK
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">
              Round-trip Latency: <strong className="text-emerald-400">{awsLatencyMs}ms</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
            <div className="flex items-start gap-2 bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/60">
              <Zap className="size-3.5 text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-300 block">Amazon Rekognition</span>
                <span className="text-zinc-500">OCR text line vectors + facial landmarks extraction</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/60">
              <Volume2 className="size-3.5 text-sky-400 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-300 block">Amazon Polly</span>
                <span className="text-zinc-500">Neural Joanna voice for on-demand screen readouts</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/60">
              <Database className="size-3.5 text-emerald-400 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-300 block">AWS Lambda & DynamoDB</span>
                <span className="text-zinc-500">Python 3.12 orchestrator + user pathology store</span>
              </div>
            </div>
          </div>
        </section>

        {/* Minimalist Deltea Footer */}
        <footer className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 pt-6 pb-12 font-mono text-xs text-zinc-500">
          <div>
            <span>FocalPoint</span> • Bharat Builds 2026 • First Commit Hackathon (Ship It Track)
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <a 
              href="https://main.d1s5otc6zch586.amplifyapp.com" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-amber-300 transition hover:underline"
            >
              amplify-live ↗
            </a>
            <span>•</span>
            <a 
              href="/calibration" 
              className="hover:text-amber-300 transition hover:underline"
            >
              9-pt calibration
            </a>
            <span>•</span>
            <a 
              href="/profile" 
              className="hover:text-amber-300 transition hover:underline"
            >
              clinical profile
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
