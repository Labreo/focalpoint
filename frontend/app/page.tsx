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
  Layers,
  Camera,
  CameraOff,
  MousePointer,
  MouseOff,
  Maximize,
  Minimize,
  CheckCircle2,
  RefreshCw,
  Terminal,
  ArrowRight,
  ExternalLink
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
  const [zoomComfortLevel, setZoomComfortLevel] = useState<'GENTLE' | 'BALANCED' | 'HIGH'>('BALANCED');
  const [hideMouseCursor, setHideMouseCursor] = useState<boolean>(true);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const [inputModeToast, setInputModeToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showUploadDrawer, setShowUploadDrawer] = useState<boolean>(false);
  const [showEndSlate, setShowEndSlate] = useState<boolean>(false);
  const [lastJsonResponse, setLastJsonResponse] = useState<any>({
    status: 200,
    processingLatencyMs: 653,
    frameId: 'frm_aws_master_001',
    dimensions: { width: 1280, height: 720 },
    dynamoDbProfile: {
      userId: 'usr_kanak_001',
      pathology: 'AMD (Central Scotoma)',
      readLatency: '3.4ms'
    },
    rekognitionOCR: {
      confidence: 0.992,
      regionsExtracted: 8,
      facialMesh468: true
    },
    pollySpeech: {
      voice: 'Joanna (en-US Neural)',
      sampleRate: '24,000 Hz',
      status: 'READY'
    }
  });

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
  const diffEngineRef = useRef<TemporalDifferentialEngine>(new TemporalDifferentialEngine(0.25, 15000));
  const lastAutoAnalysisTimeRef = useRef<number>(0);
  const lastLockedRegionIdRef = useRef<string | null>(null);
  const activeVideoRef = useRef<HTMLVideoElement | HTMLCanvasElement | null>(null);
  const viewportRectRef = useRef<DOMRect | null>(null);
  const inputModeRef = useRef<'EYE_TRACKER' | 'MOUSE_DEBUG'>(inputMode);
  const activeFocusedRegionRef = useRef<SemanticRegion | null>(null);
  const dwellProgressRef = useRef<number>(0);
  const zoomComfortLevelRef = useRef<'GENTLE' | 'BALANCED' | 'HIGH'>(zoomComfortLevel);
  const activeTemporalRegionsRef = useRef<SemanticRegion[]>(semanticRegions);

  useEffect(() => {
    inputModeRef.current = inputMode;
  }, [inputMode]);

  useEffect(() => {
    activeFocusedRegionRef.current = activeFocusedRegion;
  }, [activeFocusedRegion]);

  useEffect(() => {
    dwellProgressRef.current = dwellProgress;
  }, [dwellProgress]);

  useEffect(() => {
    zoomComfortLevelRef.current = zoomComfortLevel;
  }, [zoomComfortLevel]);

  // Sync KinematicIntentClassifier when pathology profile updates (e.g., from DynamoDB)
  useEffect(() => {
    intentClassifierRef.current.setDwellThreshold(pathologyConfig.dwellThresholdMs);
    intentClassifierRef.current.setMaxDispersion(pathologyConfig.maxDispersionPx);
  }, [pathologyConfig]);

  useEffect(() => {
    activeTemporalRegionsRef.current = semanticRegions;
  }, [semanticRegions]);

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
      const scoreRegion = scene.regions.find(r => r.id === 'cricket_match_score');
      if (scoreRegion) {
        setPinnedHUDRegions([scoreRegion]);
      }
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
          zoomLevel: 1.40,
          adaptationStrategy: { action: 'FOVEATED_OPTICAL_ZOOM', zoomLevel: 1.40 }
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
          zoomLevel: 1.40,
          adaptationStrategy: { action: 'FOVEATED_OPTICAL_ZOOM', zoomLevel: 1.40 }
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

    // 2. Classify via I-VDT State Machine using container dimensions and active temporal keyframe tracks
    const targetRegions = activeTemporalRegionsRef.current.length > 0 
      ? activeTemporalRegionsRef.current 
      : semanticRegions;

    const classification = intentClassifierRef.current.processPoint(
      smoothed,
      targetRegions,
      containerW,
      containerH,
      t0
    );

    setKinematicState(classification.state);
    setDwellProgress(classification.dwellProgress);
    setActiveFocusedRegion(classification.activeRegion);
    activeFocusedRegionRef.current = classification.activeRegion;
    dwellProgressRef.current = classification.dwellProgress;

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
  const handleProcessScreenGaze = useCallback((screenX: number, screenY: number, normX?: number, normY?: number) => {
    const rect = viewportRectRef.current;
    if (!rect || rect.width === 0 || rect.height === 0) {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const h = typeof window !== 'undefined' ? window.innerHeight : 720;
      handleProcessViewportGaze(screenX, screenY, w, h);
      return;
    }

    let rawX: number;
    let rawY: number;

    if (normX != null && normY != null) {
      // Direct ergonomic normalized gaze mapping directly onto the video container
      rawX = Math.max(0, Math.min(rect.width, normX * rect.width));
      rawY = Math.max(0, Math.min(rect.height, normY * rect.height));
    } else {
      rawX = Math.max(0, Math.min(rect.width, screenX - rect.left));
      rawY = Math.max(0, Math.min(rect.height, screenY - rect.top));
    }

    setRawGaze({ x: rawX, y: rawY });

    let videoX = rawX;
    let videoY = rawY;

    // Invert zoom & translation if currently magnified so gaze at magnified entity maintains fixation
    const activeReg = activeFocusedRegionRef.current;
    if (activeReg) {
      const comfortScale = zoomComfortLevelRef.current === 'GENTLE' ? 1.25 : zoomComfortLevelRef.current === 'HIGH' ? 1.65 : 1.40;
      const targetZoom = Math.min(activeReg.zoomLevel || 1.40, comfortScale);
      const rawProgress = dwellProgressRef.current >= 1.0 ? 1.0 : Math.max(0.0, dwellProgressRef.current);
      // Hermite cubic ease S(p) = 3p^2 - 2p^3
      const easeP = 3 * (rawProgress ** 2) - 2 * (rawProgress ** 3);
      const currentScale = 1.0 + easeP * (targetZoom - 1.0);

      if (currentScale > 1.0) {
        const box = activeReg.boundingBox;
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;

        const targetPixelX = cx * rect.width;
        const targetPixelY = cy * rect.height;
        const centerPixelX = rect.width / 2;
        const centerPixelY = rect.height / 2;

        // Context-preserving fractional pan: 42% shift towards center
        const fullDeltaX = centerPixelX - targetPixelX;
        const fullDeltaY = centerPixelY - targetPixelY;
        const deltaX = fullDeltaX * 0.42 * easeP;
        const deltaY = fullDeltaY * 0.42 * easeP;

        const maxDeltaX = ((currentScale - 1) / 2) * rect.width;
        const maxDeltaY = ((currentScale - 1) / 2) * rect.height;

        const clampedDeltaX = Math.max(-maxDeltaX, Math.min(maxDeltaX, deltaX));
        const clampedDeltaY = Math.max(-maxDeltaY, Math.min(maxDeltaY, deltaY));

        videoX = centerPixelX + (rawX - centerPixelX - clampedDeltaX) / currentScale;
        videoY = centerPixelY + (rawY - centerPixelY - clampedDeltaY) / currentScale;
        videoX = Math.max(0, Math.min(rect.width, videoX));
        videoY = Math.max(0, Math.min(rect.height, videoY));
      }
    }

    handleProcessViewportGaze(videoX, videoY, rect.width, rect.height);
  }, [handleProcessViewportGaze]);

  // One-tap neutral gaze tare baseline
  const handleTareGaze = useCallback(() => {
    webGazerManager.tareGaze();
    audioHaptics.playCalibrationSuccess();
    setLastSyncReason('Neutral gaze zeroed (tare baseline recorded)');
  }, []);

  // Mouse Simulation Pointer (active in MOUSE_DEBUG mode)
  const handleMouseMoveSimulate = (videoX: number, videoY: number) => {
    if (inputModeRef.current !== 'MOUSE_DEBUG') return;
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
          const started = await webGazerManager.start((screenX, screenY, normX, normY) => {
            if (inputModeRef.current === 'EYE_TRACKER') {
              handleProcessScreenGaze(screenX, screenY, normX, normY);
            }
          }, false);
          if (started) {
            setIsWebGazerActive(true);
            setIsWebcamActive(true);
            webGazerManager.hideOffscreenContainer();
          }
        }
      } catch (err) {
        console.warn('Failed to start WebGazer:', err);
        setIsWebGazerActive(false);
      }
    }
  };

  const handleToggleInputMode = async () => {
    const nextMode = inputMode === 'EYE_TRACKER' ? 'MOUSE_DEBUG' : 'EYE_TRACKER';
    inputModeRef.current = nextMode;
    setInputMode(nextMode);

    // Trigger on-screen toast notification for demo recording
    const toastMsg = nextMode === 'EYE_TRACKER'
      ? 'Input Mode: Mouse Sim ➔ WebGazer Eye Tracker'
      : 'Input Mode: WebGazer ➔ Assistive Cursor Mode';
    setInputModeToast({ message: toastMsg, visible: true });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setInputModeToast(prev => ({ ...prev, visible: false }));
    }, 3000);

    if (nextMode === 'EYE_TRACKER') {
      setIsWebcamActive(true);
      if (!isWebGazerActive) {
        await handleToggleWebGazer();
      } else {
        webGazerManager.resume();
        webGazerManager.hideOffscreenContainer();
      }
    } else {
      webGazerManager.pause();
    }
  };

  // Dispatches a frame to AWS Lambda Orchestrator
  const handleTriggerAwsAnalysis = useCallback(async (triggerReason: string = 'manual_inspection', deltaValue: number = 0.15) => {
    if (isAnalyzing) return;

    // CRITICAL GUARD: When a pre-authored demo scene is active, its bounding boxes are already
    // pixel-perfect and include temporal keyframes + timeContent slices. The API fallback route
    // returns the same DEMO_SCENES data but LOSES temporal fields, so overwriting would destroy
    // the working regions and cause the "random sections" bug. Only allow region replacement
    // in CUSTOM_UPLOAD or YOUTUBE_URL mode where real Rekognition inference is needed.
    const isDemoScene = currentDemoScene !== null;

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
          triggerReason,
          currentDemoScene?.id
        );

        if (result) {
          setLastJsonResponse(result);
        }

        // Only update regions for custom user uploads (not pre-authored demo scenes)
        if (!isDemoScene && result.regions && result.regions.length > 0) {
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
        setLastSyncReason(`AWS Rekognition Sync (${result.regions?.length || 0} entities in ${result.processingLatencyMs || Math.round(performance.now() - t0)}ms)`);
      }
    } catch (err) {
      console.warn('AWS Analysis invocation error:', err);
      setAwsLatencyMs(Math.round(performance.now() - t0));
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, activeFocusedRegion, dwellProgress, currentDemoScene]);

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
      if (now - lastAutoAnalysisTimeRef.current < 15000) return;

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

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      stageContainerRef.current?.requestFullscreen().catch(err => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard Shortcuts for Instant Demo Control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        setActiveFocusedRegion(null);
        setShowEndSlate(false);
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
      } else if (e.key.toLowerCase() === 'm' || e.key.toLowerCase() === 'e') {
        handleToggleInputMode();
      } else if (e.key.toLowerCase() === 't') {
        handleTareGaze();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.key.toLowerCase() === 'w') {
        e.preventDefault();
        setIsWebcamActive(prev => !prev);
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setHideMouseCursor(prev => !prev);
      } else if (e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setShowEndSlate(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFocusedRegion, handleTareGaze]);

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
              onClick={() => setShowUploadDrawer(prev => !prev)}
              className={`flex items-center gap-1.5 rounded-lg text-xs font-mono border transition cursor-pointer px-3 py-2 ${
                showUploadDrawer
                  ? 'bg-amber-400 text-zinc-950 font-bold border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
              }`}
              title="Toggle Custom Video Upload Drawer"
            >
              <Upload className="size-3.5 text-amber-400" />
              <span className="hidden sm:inline">Upload Video</span>
            </button>
          </div>

          {/* Drag-and-Drop Upload Drawer (Deltea Retro High-Contrast) */}
          {showUploadDrawer && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && (file.type.includes('video') || file.name.endsWith('.mp4') || file.name.endsWith('.webm'))) {
                  handleSelectStreamMode('CUSTOM_UPLOAD', file);
                  setShowUploadDrawer(false);
                }
              }}
              className="w-full rounded-xl border-2 border-dashed border-amber-400/80 bg-zinc-950/95 p-6 flex flex-col items-center justify-center text-center gap-3 backdrop-blur-md shadow-2xl animate-fade-in relative"
            >
              <button
                onClick={() => setShowUploadDrawer(false)}
                className="absolute top-3 right-3 text-zinc-400 hover:text-white text-xs font-mono p-1 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer"
                title="Close upload drawer"
              >
                ✕
              </button>
              <div className="size-12 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                <Upload className="size-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold text-zinc-100">
                  Drag & Drop Custom Video or Lecture Recording
                </h3>
                <p className="text-xs text-zinc-400 font-sans mt-1 max-w-md">
                  Supports MP4 and WebM. Video is processed client-side with Amazon Rekognition OCR keyframe extraction over API Gateway.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 px-4 py-2 text-xs font-mono font-bold transition shadow-md cursor-pointer"
                >
                  Browse Local Files (MP4 / WebM)
                </button>
                <span className="text-zinc-600 font-mono text-xs">•</span>
                <span className="text-[11px] font-mono text-zinc-400">
                  Client-side edge buffer • Zero upload lag
                </span>
              </div>
            </div>
          )}

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

            <button
              onClick={() => setShowUploadDrawer(prev => !prev)}
              className={`rounded-md px-2.5 py-1 text-xs transition border flex items-center gap-1.5 cursor-pointer ${
                showUploadDrawer
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/60 font-bold'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
              }`}
              title="Open video upload drawer (Shot 12)"
            >
              <Upload className="size-3 text-amber-400" />
              <span>📁 Upload Video</span>
            </button>
          </div>
        </section>

        {/* Main Stage: High-Contrast 16:9 Adaptive Viewport (Deltea Monitor Frame) */}
        <div className="w-full my-3 relative">
          {/* Animated Input Mode Switch Toast for Video Demo Recording (Shot 12) */}
          {inputModeToast.visible && (
            <div className="absolute top-4 left-4 z-40 flex items-center gap-2.5 rounded-lg border-2 border-amber-400 bg-black/95 px-3.5 py-2 font-mono text-xs font-bold text-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.6)] backdrop-blur-md animate-fade-in pointer-events-none ring-2 ring-amber-400/40">
              <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{inputModeToast.message}</span>
            </div>
          )}

          <div 
            ref={stageContainerRef}
            className="relative aspect-video w-full max-h-[72vh] mx-auto overflow-hidden rounded-2xl border-2 border-zinc-700/80 bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)]"
          >
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
              zoomComfortLevel={zoomComfortLevel}
              hideMouseCursor={hideMouseCursor}
              isWebcamActive={isWebcamActive}
              onToggleWebcam={() => setIsWebcamActive(prev => !prev)}
              onToggleHideCursor={() => setHideMouseCursor(prev => !prev)}
              onActiveRegionsUpdate={(active) => {
                activeTemporalRegionsRef.current = active;
              }}
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
                  {activeFocusedRegion 
                    ? `${zoomComfortLevel === 'GENTLE' ? '1.25' : zoomComfortLevel === 'HIGH' ? '1.65' : '1.40'}x Ergonomic Optical Push-in` 
                    : 'Direct cursor or gaze to magnify'}
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
            {/* Left: Input Mode, Tare & Tracking Status */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center rounded-lg bg-zinc-900/90 p-0.5 border border-zinc-800">
                <button
                  onClick={() => {
                    if (inputMode !== 'MOUSE_DEBUG') handleToggleInputMode();
                  }}
                  className={`rounded px-2.5 py-1 text-[11px] font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    inputMode === 'MOUSE_DEBUG'
                      ? 'bg-sky-500 text-zinc-950 shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Control gaze reticle using mouse / trackpad cursor"
                >
                  <Crosshair className="size-3" />
                  <span>🖱️ Assistive Cursor</span>
                </button>
                <button
                  onClick={() => {
                    if (inputMode !== 'EYE_TRACKER') handleToggleInputMode();
                  }}
                  className={`rounded px-2.5 py-1 text-[11px] font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    inputMode === 'EYE_TRACKER'
                      ? 'bg-emerald-400 text-zinc-950 font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Control gaze reticle using real-time webcam iris tracking"
                >
                  <Eye className="size-3" />
                  <span>👁️ Webcam Iris {isWebGazerActive ? '(Live)' : '(Click to Start)'}</span>
                </button>
              </div>

              <button
                onClick={handleTareGaze}
                className="rounded px-2.5 py-1 text-[11px] font-semibold transition border border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:text-amber-300 hover:border-amber-400/50 flex items-center gap-1 cursor-pointer"
                title="Zero eye-tracking offset to screen center (Shortcut: T)"
              >
                <span>🎯 Tare Gaze (T)</span>
              </button>

              {inputMode === 'EYE_TRACKER' && isWebGazerActive && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Iris Active</span>
                </span>
              )}

              <span className="text-zinc-600">|</span>

              <span className="text-zinc-400 text-[11px]">
                Dwell: <strong className="text-amber-400">{Math.round(dwellProgress * 100)}%</strong>
              </span>

              <span className="text-zinc-600">|</span>

              {/* Demo Mode Controls: Live Cam, Hide Cursor & Fullscreen */}
              <button
                onClick={() => setIsWebcamActive(prev => !prev)}
                className={`rounded px-2.5 py-1 text-[11px] font-semibold transition border flex items-center gap-1 cursor-pointer ${
                  isWebcamActive
                    ? 'bg-amber-400 text-zinc-950 font-bold border-amber-400 shadow-sm'
                    : 'border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:text-amber-300 hover:border-amber-400/50'
                }`}
                title="Toggle live camera picture-in-picture preview (Shortcut: W)"
              >
                {isWebcamActive ? <Camera className="size-3 text-zinc-950" /> : <CameraOff className="size-3 text-zinc-400" />}
                <span>Live Cam (W): {isWebcamActive ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setHideMouseCursor(prev => !prev)}
                className={`rounded px-2.5 py-1 text-[11px] font-semibold transition border flex items-center gap-1 cursor-pointer ${
                  hideMouseCursor
                    ? 'bg-sky-500 text-zinc-950 font-bold border-sky-400 shadow-sm'
                    : 'border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:text-sky-300 hover:border-sky-400/50'
                }`}
                title="Hide system mouse pointer for recording (Shortcut: C)"
              >
                {hideMouseCursor ? <MouseOff className="size-3 text-zinc-950" /> : <MousePointer className="size-3 text-zinc-400" />}
                <span>Cursor: {hideMouseCursor ? 'Hidden' : 'Visible'} (C)</span>
              </button>

              <button
                onClick={handleToggleFullscreen}
                className="rounded px-2.5 py-1 text-[11px] font-semibold transition border border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:text-amber-300 hover:border-amber-400/50 flex items-center gap-1 cursor-pointer"
                title="Enter fullscreen broadcast presentation mode (Shortcut: F)"
              >
                <Maximize className="size-3 text-amber-400" />
                <span>Fullscreen (F)</span>
              </button>

              <button
                onClick={() => setShowEndSlate(prev => !prev)}
                className={`rounded px-2.5 py-1 text-[11px] font-semibold transition border flex items-center gap-1 cursor-pointer ${
                  showEndSlate
                    ? 'bg-amber-400 text-zinc-950 font-bold border-amber-400 shadow-sm'
                    : 'border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:text-amber-300 hover:border-amber-400/50'
                }`}
                title="Toggle Outro End Slate overlay (Shortcut: O)"
              >
                <span>🏁 End Slate (O)</span>
              </button>
            </div>

            {/* Right Group: Zoom Comfort, Clinical Mode, Contrast */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Zoom Comfort Level Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 text-[11px]">ZOOM:</span>
                {(['GENTLE', 'BALANCED', 'HIGH'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setZoomComfortLevel(level)}
                    className={`rounded px-2 py-0.5 text-[10px] transition font-bold border cursor-pointer ${
                      zoomComfortLevel === level
                        ? 'border-amber-400 bg-amber-400/20 text-amber-300 font-bold'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                    title={`Set foveal zoom to ${level === 'GENTLE' ? '1.25x' : level === 'HIGH' ? '1.65x' : '1.40x'}`}
                  >
                    {level === 'GENTLE' ? '1.25x' : level === 'BALANCED' ? '1.40x' : '1.65x'}
                  </button>
                ))}
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

              {/* High-Contrast Color Presets */}
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
          </div>
        </section>

        {/* Spiky Sawtooth Divider */}
        <div 
          className="w-full bg-contain bg-repeat-x h-3 my-4 opacity-60" 
          style={{ backgroundImage: "url('/spiky-divider.svg')" }} 
        />

        {/* AWS Cloud Services & Telemetry Orchestrator Panel (Shots 8 & 9) */}
        <section className="w-full rounded-2xl border-2 border-zinc-800 bg-zinc-950/95 p-5 font-mono text-xs shadow-2xl backdrop-blur-md flex flex-col gap-4">
          {/* Header with Title, Status Badges, and Live Analysis Trigger */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                <Cloud className="size-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-zinc-100 tracking-wide font-mono">
                    AWS Cloud Services & Telemetry Orchestrator
                  </h2>
                  <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    HTTP 200 OK
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                  Event-driven multi-model extraction via Amazon API Gateway, AWS Lambda (Python 3.12 Graviton), DynamoDB, Rekognition & Polly
                </p>
              </div>
            </div>

            {/* Action Trigger & Latency Metric */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 block uppercase">Round-Trip Latency</span>
                <span className="text-xs font-bold text-emerald-400">
                  {awsLatencyMs}ms
                </span>
              </div>

              <button
                onClick={() => handleTriggerAwsAnalysis('manual_demo', 0.25)}
                disabled={isAnalyzing}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-mono font-bold transition shadow-md cursor-pointer ${
                  isAnalyzing
                    ? 'bg-amber-400/50 text-zinc-950 cursor-wait'
                    : 'bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_25px_rgba(251,191,36,0.5)]'
                }`}
                title="Dispatch current frame keyframe to Amazon API Gateway and AWS Lambda orchestrator (Shot 8)"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin text-zinc-950" />
                    <span>Analyzing Frame...</span>
                  </>
                ) : (
                  <>
                    <Zap className="size-3.5 text-zinc-950 fill-zinc-950" />
                    <span>⚡ Run Live AWS Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4 Architecture Component Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
            {/* Card 1: API Gateway & Lambda */}
            <div className="flex flex-col gap-1.5 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 hover:border-amber-400/40 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Zap className="size-3.5" />
                  <span>API Gateway & Lambda</span>
                </div>
                <span className="rounded bg-zinc-800 text-zinc-300 px-1.5 py-0.2 text-[9px] font-mono">
                  24ms dispatch
                </span>
              </div>
              <p className="text-zinc-400 text-[11px] font-sans leading-snug">
                Python 3.12 Graviton orchestrator. Evaluates edge frame differentials and coordinates concurrent inference.
              </p>
              <div className="mt-auto pt-1 text-[10px] text-zinc-500 font-mono">
                <code>focalpoint-orchestrator</code>
              </div>
            </div>

            {/* Card 2: DynamoDB User Pathology Store */}
            <div className="relative flex flex-col gap-1.5 bg-zinc-900/60 p-3.5 rounded-xl border-2 border-emerald-500/50 hover:border-emerald-400 transition shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Database className="size-3.5" />
                  <span>Amazon DynamoDB</span>
                </div>
                <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 px-2 py-0.5 text-[9px] font-black font-mono flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ● SYNCHRONIZED (3.4ms)
                </span>
              </div>
              <p className="text-zinc-400 text-[11px] font-sans leading-snug">
                Sub-millisecond retrieval of user ophthalmic profiles: AMD central scotoma, 280ms dwell, and amber contrast preferences.
              </p>
              <div className="mt-auto pt-1 text-[10px] text-emerald-400/90 font-mono font-bold flex items-center justify-between">
                <span>usr_kanak_001</span>
                <span>3.4ms read</span>
              </div>
            </div>

            {/* Card 3: Amazon Rekognition */}
            <div className="flex flex-col gap-1.5 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 hover:border-amber-400/40 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Eye className="size-3.5" />
                  <span>Amazon Rekognition</span>
                </div>
                <span className="rounded bg-zinc-800 text-zinc-300 px-1.5 py-0.2 text-[9px] font-mono">
                  99.2% Conf
                </span>
              </div>
              <p className="text-zinc-400 text-[11px] font-sans leading-snug">
                DetectText OCR extracts semantic bounding boxes from slide code while 468-point facial mesh tracks presenter face.
              </p>
              <div className="mt-auto pt-1 text-[10px] text-zinc-500 font-mono">
                8 Entities • OCR + Face Mesh
              </div>
            </div>

            {/* Card 4: Amazon Polly */}
            <div className="flex flex-col gap-1.5 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 hover:border-sky-400/40 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sky-400 font-bold">
                  <Volume2 className="size-3.5" />
                  <span>Amazon Polly</span>
                </div>
                <span className="rounded bg-zinc-800 text-zinc-300 px-1.5 py-0.2 text-[9px] font-mono">
                  Neural Joanna
                </span>
              </div>
              <p className="text-zinc-400 text-[11px] font-sans leading-snug">
                Neural text-to-speech engine synthesizes 24 kHz high-fidelity audio readouts of technical slide diagrams on demand.
              </p>
              <div className="mt-auto pt-1 text-[10px] text-sky-400/80 font-mono">
                24,000 Hz MP3 Audio Stream
              </div>
            </div>
          </div>

          {/* Live Extraction Pipeline JSON Telemetry Card with Animated Amber Bounding Boxes (Shot 9) */}
          <div className="relative rounded-xl border-2 border-amber-400/80 bg-black/90 p-4 shadow-[0_0_30px_rgba(251,191,36,0.25)] flex flex-col gap-2.5">
            {/* Corner Decorative Crosshairs */}
            <div className="pointer-events-none absolute -top-1.5 -left-1.5 size-3 border-t-2 border-l-2 border-amber-400" />
            <div className="pointer-events-none absolute -top-1.5 -right-1.5 size-3 border-t-2 border-r-2 border-amber-400" />
            <div className="pointer-events-none absolute -bottom-1.5 -left-1.5 size-3 border-b-2 border-l-2 border-amber-400" />
            <div className="pointer-events-none absolute -bottom-1.5 -right-1.5 size-3 border-b-2 border-r-2 border-amber-400" />

            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-mono">
                <Terminal className="size-3.5" />
                <span>SERVERLESS PIPELINE TELEMETRY PAYLOAD</span>
                <span className="text-zinc-500 font-normal">|</span>
                <span className="text-emerald-400 font-mono">HTTP 200 OK</span>
                <span className="text-zinc-500 font-normal">•</span>
                <span className="text-zinc-400 font-mono">Latency: {awsLatencyMs}ms</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                {lastSyncReason}
              </span>
            </div>

            {/* Formatted Code Block */}
            <pre className="text-[11px] font-mono leading-relaxed text-zinc-300 overflow-x-auto max-h-56 p-2.5 rounded bg-zinc-950 border border-zinc-900 scrollbar-thin">
              <code>{JSON.stringify(lastJsonResponse, null, 2)}</code>
            </pre>
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

        {/* Full-Bleed Outro End Slate Modal (Shot 13 — Shortcut: O or Esc) */}
        {showEndSlate && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            {/* Retro CRT scanline effect */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-40" />

            <div className="relative z-10 max-w-2xl flex flex-col items-center gap-5 border-2 border-amber-400 bg-zinc-950/95 p-8 rounded-2xl shadow-[0_0_60px_rgba(251,191,36,0.5)]">
              <div className="size-16 rounded-2xl bg-amber-400 text-zinc-950 flex items-center justify-center font-mono font-black text-3xl shadow-[0_0_30px_rgba(251,191,36,0.6)]">
                FP
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-400/10 px-3 py-1 text-xs font-mono font-bold text-amber-300 uppercase tracking-widest mb-3">
                  <Sparkles className="size-3 text-amber-400" />
                  <span>Bharat Builds 2026 • AWS Ship It Track</span>
                </div>
                <h2 className="text-3xl font-mono font-extrabold text-zinc-50 tracking-tight">
                  FocalPoint: Intent-Aware Assistive Vision
                </h2>
                <p className="text-sm font-sans text-zinc-300 mt-2 max-w-lg leading-relaxed">
                  Empowering 200M+ developers with central scotoma and peripheral vision loss to navigate technical media, read code, and track live broadcasts without barriers.
                </p>
              </div>

              {/* AWS Stack Architecture Chips */}
              <div className="flex flex-wrap justify-center gap-2 text-[10px] font-mono text-zinc-400 max-w-md">
                <span className="rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-zinc-300">AWS Amplify</span>
                <span className="rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-zinc-300">Amazon API Gateway</span>
                <span className="rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-amber-400 font-bold">AWS Lambda (Python 3.12)</span>
                <span className="rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-emerald-400 font-bold">Amazon DynamoDB</span>
                <span className="rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-amber-300">Amazon Rekognition OCR</span>
                <span className="rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-sky-400">Amazon Polly TTS</span>
              </div>

              {/* Verified Links */}
              <div className="flex flex-col sm:flex-row items-center gap-4 text-xs font-mono mt-2">
                <a
                  href="https://main.d1s5otc6zch586.amplifyapp.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2.5 transition shadow-lg hover:shadow-[0_0_20px_rgba(251,191,36,0.6)]"
                >
                  <ExternalLink className="size-3.5" />
                  <span>main.d1s5otc6zch586.amplifyapp.com</span>
                </a>
                <a
                  href="https://github.com/Labreo/focalpoint"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-4 py-2.5 transition"
                >
                  <span>💾 github.com/Labreo/focalpoint</span>
                </a>
              </div>

              {/* Modal Actions: Close */}
              <div className="flex items-center gap-3 pt-2 text-xs font-mono">
                <button
                  onClick={() => setShowEndSlate(false)}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-4 py-2 transition cursor-pointer"
                >
                  Close Overlay (O / Esc)
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
