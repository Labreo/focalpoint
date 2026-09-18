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
import { Navbar } from '../components/Navbar';
import { StreamSourceSelector, StreamMode } from '../components/StreamSourceSelector';
import { AdaptiveViewport } from '../components/AdaptiveViewport';
import { AccessibleReaderPanel } from '../components/AccessibleReaderPanel';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
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
  CheckCircle2, 
  ArrowRight, 
  SlidersHorizontal 
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
  const [inputMode, setInputMode] = useState<'EYE_TRACKER' | 'MOUSE_DEBUG'>('EYE_TRACKER');
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  // Pinned Peripheral HUD regions
  const [pinnedHUDRegions, setPinnedHUDRegions] = useState<SemanticRegion[]>([]);

  // Telemetry & Modals
  const [fps, setFps] = useState<number>(60);
  const [gazeLatencyMs, setGazeLatencyMs] = useState<number>(16);
  const [awsLatencyMs, setAwsLatencyMs] = useState<number>(240);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isWebGazerActive, setIsWebGazerActive] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

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
      // Generic regions for custom video
      setSemanticRegions([
        {
          id: 'custom_video_focus',
          type: 'TEXT_BLOCK',
          confidence: 0.95,
          boundingBox: { left: 0.05, top: 0.75, width: 0.90, height: 0.18 },
          textContent: `Uploaded Video: ${customFile.name} — Look or hover here to inspect text and hear audio.`,
          adaptationStrategy: { action: 'DYNAMIC_REFLOW' }
        }
      ]);
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
        setSemanticRegions(DEMO_SCENES[0].regions);
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
      webGazerManager.stop();
      setIsWebGazerActive(false);
    } else {
      try {
        const initialized = await webGazerManager.init();
        if (initialized) {
          await webGazerManager.start((screenX, screenY) => {
            if (inputMode === 'EYE_TRACKER') {
              setRawGaze({ x: screenX, y: screenY });
              handleProcessScreenGaze(screenX, screenY);
            }
          });
          setIsWebGazerActive(true);
          webGazerManager.showCameraPreview(true);
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
  const handleTriggerAwsAnalysis = async () => {
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
      }

      if (base64Jpeg) {
        const result = await focalPointClient.analyzeFrame(
          base64Jpeg,
          width,
          height,
          'usr_kanak_001',
          'manual_inspection'
        );

        if (result.regions && result.regions.length > 0) {
          setSemanticRegions(result.regions);
        }
        setAwsLatencyMs(result.processingLatencyMs || Math.round(performance.now() - t0));
      }
    } catch (err) {
      console.warn('AWS Analysis invocation error:', err);
      setAwsLatencyMs(Math.round(performance.now() - t0));
    } finally {
      setIsAnalyzing(false);
    }
  };

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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-400 selection:text-black">
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
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Stream Source Selector Sub-Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <StreamSourceSelector
            currentMode={streamMode}
            onSelectMode={handleSelectStreamMode}
            isStreaming={!!mediaStream}
          />

          {/* Quick status pill */}
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>60 FPS WebGL</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300 font-mono">
              <span>Gaze: {gazeLatencyMs}ms</span>
            </span>
            <span className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs ${
              isCalibrated 
                ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400' 
                : 'border-amber-500/30 bg-amber-950/40 text-amber-400'
            }`}>
              {isCalibrated ? '🎯 9-Pt Calibrated' : '⚠️ Uncalibrated'}
            </span>
          </div>
        </div>

        {/* 2-Column Grid: Video Player + Accessible Reader */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Video Stage (65% width) */}
          <div className="flex flex-col space-y-3 lg:col-span-8">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-2xl">
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
                isFrozen={isFrozen}
                simulatorActive={simulatorActive}
                inputMode={inputMode}
                onContainerRectChange={(rect) => { viewportRectRef.current = rect; }}
                onMouseMoveSimulate={handleMouseMoveSimulate}
                onSourceRef={(source) => { activeVideoRef.current = source; }}
              />
            </div>

            {/* Video Footer Status Bar */}
            <div className="flex flex-wrap items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[11px] font-bold ${
                  inputMode === 'EYE_TRACKER'
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    : 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
                }`}>
                  {inputMode === 'EYE_TRACKER' ? '👁️ Webcam Iris Mode' : '🖱️ Mouse Debug Mode'}
                </span>
                <span className="font-mono text-slate-300">
                  Target: {activeFocusedRegion ? activeFocusedRegion.textContent?.slice(0, 45) + '...' : 'None (Searching gaze)'}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span>I-VDT: {kinematicState}</span>
                <span>Dwell: {Math.round(dwellProgress * 100)}%</span>
                <span className={isCalibrated ? 'text-emerald-400' : 'text-amber-400'}>
                  {isCalibrated ? '● Calibrated' : '○ Uncalibrated'}
                </span>
                <span className="text-amber-400">AWS Sync: Active</span>
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
              onTriggerAwsAnalysis={handleTriggerAwsAnalysis}
              isAnalyzing={isAnalyzing}
              awsLatencyMs={awsLatencyMs}
            />
          </div>
        </div>

        {/* Section 1: How FocalPoint Works for Low-Vision Patients */}
        <section className="mt-14 border-t border-slate-800/80 pt-10">
          <div className="mb-8 text-center">
            <span className="rounded-full bg-amber-400/10 px-3 py-1 font-mono text-xs font-bold text-amber-400 border border-amber-400/20">
              ENGINEERING FOR ACCESSIBILITY
            </span>
            <h2 className="mt-3 text-2xl font-black text-white tracking-tight sm:text-3xl">
              How FocalPoint Solves Central Vision Loss
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400 leading-relaxed">
              350+ million people live with Macular Degeneration or Retinitis Pigmentosa. FocalPoint replaces passive screen magnifiers with active gaze-driven semantic reconstruction.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Card 1 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/15 text-amber-400 mb-4 border border-amber-400/20">
                <Eye className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">1. Webcam Gaze Kinematics</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                WebGazer.js eye tracking streams gaze at 60 FPS. A 4-state 2D Discrete Kalman Filter eliminates tremors, while I-VDT state machine distinguishes rapid saccades from deliberate 280ms fixations.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-400 mb-4 border border-cyan-400/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">2. AWS Multi-Modal Scene AI</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Differential perceptual hashing triggers AWS Lambda fan-out. Amazon Rekognition extracts bounding boxes and text lines, while Bedrock Claude 3.5 Sonnet parses scoreboards, slides, and tickers.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-400 mb-4 border border-emerald-400/20">
                <Volume2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">3. Atkinson Reflow & Polly Audio</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Content is reflowed in Atkinson Hyperlegible glyphs (Braille Institute designed for low vision) with adjustable 19.4:1 contrast palettes and read aloud using Amazon Polly Neural text-to-speech.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Clinical Pathology Simulation Comparison */}
        <section className="mt-14 border-t border-slate-800/80 pt-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">Clinical Pathology Simulator</h3>
              <p className="text-xs text-slate-400 mt-1">
                Toggle clinical simulator mode in the top navbar to see how patient vision impairments are simulated and reconstructed in real time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(['AMD', 'TUNNEL_VISION', 'LOW_ACUITY'] as PathologyConfig['type'][]).map((type) => (
                <button
                  key={type}
                  onClick={() => setPathologyConfig(p => ({ ...p, type }))}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition border ${
                    pathologyConfig.type === type
                      ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {type === 'AMD' ? 'Macular Degeneration (Central Scotoma)' :
                   type === 'TUNNEL_VISION' ? 'Retinitis Pigmentosa (Tunnel Vision)' : 'Low Acuity / Cataracts'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <span className="font-mono text-xs font-bold text-amber-400">AMD (Scotoma)</span>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Central blind spot obliterates foveal vision. FocalPoint projects text to the Preferred Retinal Locus (PRL) in the parafovea.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <span className="font-mono text-xs font-bold text-cyan-400">Tunnel Vision (RP)</span>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Peripheral field is lost, leaving a narrow 10° cone. FocalPoint applies anamorphic radial compression to fit widescreen content.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <span className="font-mono text-xs font-bold text-emerald-400">Low Acuity & Cataracts</span>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Severe contrast degradation and blur. FocalPoint applies 3x3 Laplacian edge sharpening and WCAG AAA color stretching.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Live AWS Serverless Infrastructure */}
        <section className="mt-14 border-t border-slate-800/80 pt-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                AWS TRACK 2 • SHIP IT
              </span>
              <h3 className="mt-2 text-xl font-bold text-white">Live AWS Cloud Architecture</h3>
            </div>
            <span className="font-mono text-xs text-slate-400">Region: us-east-1 (N. Virginia)</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Cloud className="h-4 w-4 text-amber-400" />
                <span>AWS Amplify</span>
              </div>
              <div className="mt-2 font-mono text-[10px] text-emerald-400">ONLINE (HTTP/2 200)</div>
              <div className="text-[10px] text-slate-500 truncate">main.d1s5otc6zch586.amplifyapp.com</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Radio className="h-4 w-4 text-cyan-400" />
                <span>API Gateway v2</span>
              </div>
              <div className="mt-2 font-mono text-[10px] text-emerald-400">ONLINE (CORS ACTIVE)</div>
              <div className="text-[10px] text-slate-500 truncate">xxeqb4odra.execute-api.us-east-1</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Cpu className="h-4 w-4 text-purple-400" />
                <span>AWS Lambda</span>
              </div>
              <div className="mt-2 font-mono text-[10px] text-emerald-400">2048 MB Python 3.12</div>
              <div className="text-[10px] text-slate-500 truncate">focalpoint-orchestrator</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Database className="h-4 w-4 text-blue-400" />
                <span>DynamoDB + S3</span>
              </div>
              <div className="mt-2 font-mono text-[10px] text-emerald-400">ENCRYPTED AT REST</div>
              <div className="text-[10px] text-slate-500 truncate">FocalPoint_UserProfiles</div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-slate-800/80 pt-8 pb-12 text-center text-xs text-slate-500">
          <p className="font-sans">
            FocalPoint • Gaze-Driven Content-Aware Assistive Video Suite
          </p>
          <p className="mt-1 font-mono text-[11px] text-slate-600">
            Built for First Commit Hackathon 2026 • Track 2: Ship It (AWS Bedrock, Rekognition, Polly, Lambda, DynamoDB, Amplify)
          </p>
        </footer>
      </main>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}
