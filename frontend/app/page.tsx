'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  SemanticRegion, 
  PathologyConfig, 
  KinematicState, 
  ContrastPreset, 
  DemoScene 
} from '../types';
import { DEMO_SCENES } from '../lib/demo_scenes';
import { GazeKalmanFilter2D } from '../lib/kalman_filter';
import { KinematicIntentClassifier } from '../lib/eye_kinematics';
import { audioHaptics } from '../lib/synthetic_audio';
import { webGazerManager } from '../lib/webgazer_adapter';
import { focalPointClient } from '../lib/aws_client';
import { TemporalDifferentialEngine } from '../lib/differential_engine';
import { Navbar } from '../components/Navbar';
import { StreamSourceSelector, StreamMode } from '../components/StreamSourceSelector';
import { AdaptiveViewport } from '../components/AdaptiveViewport';
import { AccessibleReaderPanel } from '../components/AccessibleReaderPanel';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { SystemSpecsModal } from '../components/SystemSpecsModal';
import { 
  Eye, 
  Sparkles, 
  Volume2, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Database, 
  Radio, 
  Cloud, 
  Zap
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
  // Media Stream & Video Source State
  const [streamMode, setStreamMode] = useState<StreamMode>('DEMO_CRICKET');
  const [videoSrc, setVideoSrc] = useState<string | null>('/videos/cricket.mp4');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [currentDemoScene, setCurrentDemoScene] = useState<DemoScene | null>(DEMO_SCENES[0]);
  const [semanticRegions, setSemanticRegions] = useState<SemanticRegion[]>(DEMO_SCENES[0].regions);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);

  // Ophthalmic & Visual Configuration
  const [pathologyConfig, setPathologyConfig] = useState<PathologyConfig>(DEFAULT_PATHOLOGY);
  const [contrastPreset, setContrastPreset] = useState<ContrastPreset>('AMBER');
  const [fontScale, setFontScale] = useState<number>(1.25);
  const [simulatorActive, setSimulatorActive] = useState<boolean>(false);

  // Eye Kinematics & Tracking State
  const [rawGaze, setRawGaze] = useState<{ x: number; y: number }>({ x: 600, y: 400 });
  const [smoothedGaze, setSmoothedGaze] = useState<{ x: number; y: number }>({ x: 600, y: 400 });
  const [kinematicState, setKinematicState] = useState<KinematicState>('SACCADE');
  const [dwellProgress, setDwellProgress] = useState<number>(0);
  const [activeFocusedRegion, setActiveFocusedRegion] = useState<SemanticRegion | null>(null);
  const [inputMode, setInputMode] = useState<'EYE_TRACKER' | 'MOUSE_DEBUG'>('MOUSE_DEBUG');
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  // Pinned Peripheral HUD regions
  const [pinnedHUDRegions, setPinnedHUDRegions] = useState<SemanticRegion[]>([]);

  // Telemetry & Modals
  const [fps, setFps] = useState<number>(60);
  const [gazeLatencyMs, setGazeLatencyMs] = useState<number>(16);
  const [awsLatencyMs, setAwsLatencyMs] = useState<number>(240);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState<boolean>(false);
  const [isWebGazerActive, setIsWebGazerActive] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Edge-Computed Temporal Differential Engine State
  const diffEngineRef = useRef<TemporalDifferentialEngine>(new TemporalDifferentialEngine(0.12, 6000));
  const lastAutoAnalysisTimeRef = useRef<number>(0);
  const [autoSyncAWS, setAutoSyncAWS] = useState<boolean>(true);
  const [lastSyncReason, setLastSyncReason] = useState<string>('Initialization');
  const [lastDelta, setLastDelta] = useState<number>(0);
  const [isSceneChanging, setIsSceneChanging] = useState<boolean>(false);

  // Math references (persist across renders)
  const kalmanFilterRef = useRef<GazeKalmanFilter2D>(new GazeKalmanFilter2D(0.08, 18.0));
  const intentClassifierRef = useRef<KinematicIntentClassifier>(
    new KinematicIntentClassifier(DEFAULT_PATHOLOGY.dwellThresholdMs, DEFAULT_PATHOLOGY.maxDispersionPx)
  );
  const activeVideoRef = useRef<HTMLVideoElement | HTMLCanvasElement | null>(null);
  const viewportRectRef = useRef<DOMRect | null>(null);
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());

  // Check calibration status on mount
  useEffect(() => {
    setIsCalibrated(webGazerManager.isCalibrated());
  }, []);

  // Handle Stream Mode Switch
  const handleSelectStreamMode = async (mode: StreamMode, customFile?: File) => {
    // Stop existing WebRTC media tracks
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }

    setStreamMode(mode);

    if (mode === 'DEMO_CRICKET') {
      setVideoSrc('/videos/cricket.mp4');
      setCurrentDemoScene(DEMO_SCENES[0]);
      setSemanticRegions(DEMO_SCENES[0].regions);
    } else if (mode === 'DEMO_LECTURE') {
      setVideoSrc('/videos/lecture.mp4');
      setCurrentDemoScene(DEMO_SCENES[1]);
      setSemanticRegions(DEMO_SCENES[1].regions);
    } else if (mode === 'DEMO_NEWS') {
      setVideoSrc('/videos/news.mp4');
      setCurrentDemoScene(DEMO_SCENES[2]);
      setSemanticRegions(DEMO_SCENES[2].regions);
    } else if (mode === 'CUSTOM_UPLOAD' && customFile) {
      const url = URL.createObjectURL(customFile);
      setVideoSrc(url);
      setCurrentDemoScene(null);
      setSemanticRegions([
        {
          id: 'custom_video_scan',
          type: 'TEXT_BLOCK',
          confidence: 0.99,
          boundingBox: { left: 0.05, top: 0.78, width: 0.90, height: 0.16 },
          textContent: `Ingesting "${customFile.name}" via Amazon Rekognition & Bedrock Claude 3.5 Sonnet... Look or click here.`,
          adaptationStrategy: { action: 'DYNAMIC_REFLOW' }
        }
      ]);
      setTimeout(() => {
        handleTriggerAwsAnalysis('INITIAL_FRAME', 1.0);
      }, 500);
    } else if (mode === 'SCREEN_CAPTURE') {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        const track = stream.getVideoTracks()[0];
        if (track) {
          track.onended = () => {
            handleSelectStreamMode('DEMO_CRICKET');
          };
        }
        setMediaStream(stream);
        setVideoSrc(null);
        setCurrentDemoScene(null);
        setSemanticRegions([
          {
            id: 'screen_capture_scan',
            type: 'TEXT_BLOCK',
            confidence: 0.99,
            boundingBox: { left: 0.05, top: 0.05, width: 0.90, height: 0.12 },
            textContent: 'Live Screen Share Active: Decomposing viewport with Amazon Rekognition OCR...',
            adaptationStrategy: { action: 'DYNAMIC_REFLOW' }
          }
        ]);
        setTimeout(() => {
          handleTriggerAwsAnalysis('INITIAL_FRAME', 1.0);
        }, 600);
      } catch {
        handleSelectStreamMode('DEMO_CRICKET');
      }
    }
  };

  // Process Gaze Coordinate in Video-Relative Space
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

    // 3. Trigger Lock on Dwell Complete (>= 1.0)
    if (classification.dwellProgress >= 1.0 && classification.activeRegion) {
      audioHaptics.playLockChime();
    }

    setGazeLatencyMs(Math.max(8, Math.round(performance.now() - t0)));
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

    // Map screen coordinate to video-relative pixel coordinates
    const videoX = Math.max(0, Math.min(rect.width, screenX - rect.left));
    const videoY = Math.max(0, Math.min(rect.height, screenY - rect.top));

    handleProcessViewportGaze(videoX, videoY, rect.width, rect.height);
  }, [handleProcessViewportGaze]);

  // Mouse Simulation Pointer (active only in MOUSE_DEBUG mode)
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
        console.warn('Failed to start WebGazer eye tracking:', err);
        setIsWebGazerActive(false);
      }
    }
  };

  // Switch between Eye Tracker and Mouse Debug Modes
  const handleToggleInputMode = () => {
    setInputMode(prev => {
      const next = prev === 'EYE_TRACKER' ? 'MOUSE_DEBUG' : 'EYE_TRACKER';
      if (next === 'EYE_TRACKER' && !isWebGazerActive) {
        handleToggleWebGazer();
      }
      return next;
    });
  };

  // Cleanup WebGazer on unmount
  useEffect(() => {
    return () => {
      webGazerManager.stop();
    };
  }, []);

  // Trigger Live Deep AWS Vision Analysis (Rekognition + Bedrock Claude)
  const handleTriggerAwsAnalysis = useCallback(async (triggerReason: string = 'manual_inspection', deltaValue: number = 0) => {
    const video = activeVideoRef.current;
    if (!video || isAnalyzing) return;

    setIsAnalyzing(true);
    const t0 = performance.now();

    try {
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
          setSemanticRegions(result.regions);
        }
        setAwsLatencyMs(result.processingLatencyMs || Math.round(performance.now() - t0));
        const formattedReason = triggerReason === 'SCENE_DELTA' 
          ? 'Scene Delta' 
          : triggerReason === 'TIMEOUT_KEEPALIVE' 
            ? 'Keepalive' 
            : triggerReason === 'INITIAL_FRAME' 
              ? 'Initial Scan' 
              : 'Manual';
        setLastSyncReason(`${formattedReason} (${(deltaValue * 100).toFixed(1)}%)`);
      }
    } catch (err) {
      console.warn('AWS Analysis invocation error:', err);
      setAwsLatencyMs(Math.round(performance.now() - t0));
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing]);

  // Edge-Computed Temporal Differential Ingestion Loop (1.6 FPS with Dwell Protection)
  useEffect(() => {
    if (!autoSyncAWS) return;

    const interval = setInterval(() => {
      const source = activeVideoRef.current;
      // Protect user experience: Never interrupt during active dwell accumulation or focused zoom lock!
      if (!source || isAnalyzing || dwellProgress > 0 || activeFocusedRegion !== null) return;

      if (source instanceof HTMLVideoElement) {
        if (source.paused || source.ended || source.readyState < 2) return;
      }

      // Enforce 5-second minimum interval between automatic cloud vision dispatches
      const now = performance.now();
      if (now - lastAutoAnalysisTimeRef.current < 5000) return;

      const evalResult = diffEngineRef.current.evaluateFrame(source);
      setLastDelta(evalResult.delta);

      if (evalResult.shouldAnalyze) {
        lastAutoAnalysisTimeRef.current = now;
        setIsSceneChanging(true);
        setTimeout(() => setIsSceneChanging(false), 1200);
        handleTriggerAwsAnalysis(evalResult.reason, evalResult.delta);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [autoSyncAWS, isAnalyzing, dwellProgress, activeFocusedRegion, handleTriggerAwsAnalysis]);

  // Pin & Unpin HUD widgets
  const handlePinHUD = (region: SemanticRegion) => {
    if (!pinnedHUDRegions.some(r => r.id === region.id)) {
      setPinnedHUDRegions(prev => [...prev, region]);
      audioHaptics.playLockChime();
    }
  };

  const handleUnpinHUD = (regionId: string) => {
    setPinnedHUDRegions(prev => prev.filter(r => r.id !== regionId));
  };

  // 60 FPS Counter
  useEffect(() => {
    let animId: number;
    const countFrame = () => {
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }
      animId = requestAnimationFrame(countFrame);
    };
    animId = requestAnimationFrame(countFrame);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-400 selection:text-black">
      {/* Top Navigation */}
      <Navbar
        isWebGazerActive={isWebGazerActive}
        onToggleWebGazer={handleToggleWebGazer}
        simulatorActive={simulatorActive}
        onToggleSimulator={() => setSimulatorActive(prev => !prev)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        isCalibrated={isCalibrated}
        inputMode={inputMode}
        onToggleInputMode={handleToggleInputMode}
      />

      {/* Main Studio Container */}
      <main className="mx-auto max-w-7xl px-4 py-5">
        {/* Stream Source & Precision Telemetry Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <StreamSourceSelector
            currentMode={streamMode}
            onSelectMode={handleSelectStreamMode}
            isStreaming={!!mediaStream}
          />

          {/* Precision Telemetry & Architecture Trigger */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-2.5 py-1 text-zinc-300 font-mono text-[11px] backdrop-blur-md">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>60 FPS GPU</span>
              </span>
              <span className="text-zinc-600">•</span>
              <span>{gazeLatencyMs}ms Gaze</span>
              <span className="text-zinc-600">•</span>
              <span className={isSceneChanging ? 'text-amber-400 font-bold' : 'text-zinc-400'}>
                Δ {(lastDelta * 100).toFixed(1)}%
              </span>
            </div>

            <button
              onClick={() => setIsSpecsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 transition shadow-sm"
              title="Inspect AWS Cloud Architecture & Clinical Pathology Specs"
            >
              <Cpu className="h-3.5 w-3.5 text-amber-400" />
              <span>Specs & Cloud</span>
            </button>
          </div>
        </div>

        {/* 2-Column Grid: Video Stage + Accessible Reader */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left Column: Video Stage (65% width) */}
          <div className="flex flex-col space-y-2.5 lg:col-span-8">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800/80 bg-black shadow-2xl">
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
                  audioHaptics.playLockChime();
                }}
                onPinHUD={handlePinHUD}
                onResetFocus={() => setActiveFocusedRegion(null)}
                pinnedHUDRegions={pinnedHUDRegions}
                onUnpinHUD={handleUnpinHUD}
                isFrozen={isFrozen}
                simulatorActive={simulatorActive}
                inputMode={inputMode}
                onContainerRectChange={(rect) => { viewportRectRef.current = rect; }}
                onMouseMoveSimulate={handleMouseMoveSimulate}
                onSourceRef={(source) => { activeVideoRef.current = source; }}
              />
            </div>

            {/* Precision Broadcast Telemetry Ribbon */}
            <div className="flex flex-wrap items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-3.5 py-2 text-xs text-zinc-400 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={inputMode === 'EYE_TRACKER' ? handleToggleWebGazer : handleToggleInputMode}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide transition ${
                    inputMode === 'EYE_TRACKER'
                      ? isWebGazerActive
                        ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'bg-amber-400/15 text-amber-300 border border-amber-400/40 hover:bg-amber-400/25 cursor-pointer animate-pulse'
                      : 'bg-sky-400/10 text-sky-300 border border-sky-400/30'
                  }`}
                  title={
                    inputMode === 'EYE_TRACKER'
                      ? isWebGazerActive
                        ? 'Webcam iris tracking active (click to pause)'
                        : 'Webcam tracking paused - click to activate'
                      : 'Motor Assist Mode active - click to switch to iris eye tracker'
                  }
                >
                  {inputMode === 'EYE_TRACKER' 
                    ? isWebGazerActive 
                      ? '👁️ Iris Gaze: Tracking Live' 
                      : '👁️ Webcam Eye Tracker: Off (Click to Start)' 
                    : '🖱️ Motor Assist Active'}
                </button>
                <span className="font-mono text-zinc-300 text-[11px] truncate max-w-xs sm:max-w-md">
                  Target: {activeFocusedRegion ? (activeFocusedRegion.label || activeFocusedRegion.textContent) : 'Direct cursor/gaze to zoom into players or score'}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-500">
                <span>State: <span className="text-zinc-300">{kinematicState}</span></span>
                <span>Dwell: <span className="text-zinc-300">{Math.round(dwellProgress * 100)}%</span></span>
                <span className={isCalibrated ? 'text-emerald-400' : 'text-amber-400'}>
                  {isCalibrated ? '● Calibrated' : '○ 9-Pt Pending'}
                </span>
                <span className="text-zinc-400">AWS: {lastSyncReason}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Accessible Focus Reader (35% width) */}
          <div className="lg:col-span-4 flex flex-col">
            <AccessibleReaderPanel
              activeRegion={activeFocusedRegion}
              contrastPreset={contrastPreset}
              onContrastChange={(preset) => setContrastPreset(preset)}
              fontScale={fontScale}
              onFontScaleChange={(scale) => setFontScale(scale)}
              pinnedRegions={pinnedHUDRegions}
              onUnpinHUD={handleUnpinHUD}
              onTriggerAwsAnalysis={() => handleTriggerAwsAnalysis('manual_inspection', lastDelta)}
              isAnalyzing={isAnalyzing}
              awsLatencyMs={awsLatencyMs}
              autoSyncAWS={autoSyncAWS}
              onToggleAutoSyncAWS={() => setAutoSyncAWS(p => !p)}
              lastSyncReason={lastSyncReason}
              lastDelta={lastDelta}
              allRegions={semanticRegions}
              onSelectRegion={(region) => {
                setActiveFocusedRegion(region);
                audioHaptics.playLockChime();
              }}
            />
          </div>
        </div>

        {/* Minimalist Studio Footer */}
        <footer className="mt-12 flex flex-wrap items-center justify-between border-t border-zinc-800/80 pt-6 pb-10 text-xs text-zinc-500">
          <div>
            <span className="font-semibold text-zinc-400">FocalPoint Studio</span> • Assistive Video Kinematics
            <p className="mt-0.5 font-mono text-[11px] text-zinc-600">
              AWS Track 2: Ship It • Amazon Bedrock • Rekognition • Polly • Lambda • Amplify
            </p>
          </div>
          <div className="flex items-center gap-3 mt-3 sm:mt-0 font-mono text-[11px]">
            <button
              onClick={() => setIsSpecsModalOpen(true)}
              className="hover:text-zinc-300 transition underline underline-offset-2"
            >
              System Specs
            </button>
            <span>•</span>
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="hover:text-zinc-300 transition underline underline-offset-2"
            >
              Shortcuts (?)
            </button>
            <span>•</span>
            <a
              href="/calibration"
              className="hover:text-zinc-300 transition underline underline-offset-2"
            >
              Calibration
            </a>
          </div>
        </footer>
      </main>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* System Specifications & Architecture Modal */}
      <SystemSpecsModal
        isOpen={isSpecsModalOpen}
        onClose={() => setIsSpecsModalOpen(false)}
        activePathology={pathologyConfig}
        onSelectPathology={(type) => setPathologyConfig(p => ({ ...p, type }))}
      />
    </div>
  );
}
