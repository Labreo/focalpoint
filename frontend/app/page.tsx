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
import { TelemetryBar } from '../components/TelemetryBar';
import { StreamSourceSelector, StreamMode } from '../components/StreamSourceSelector';
import { AdaptiveViewport } from '../components/AdaptiveViewport';
import { ReflowDrawer } from '../components/ReflowDrawer';
import { PersistentHUDOverlay } from '../components/PersistentHUDOverlay';
import { PathologySimulator } from '../components/PathologySimulator';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';

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
  // Media Stream & Scenario State
  const [streamMode, setStreamMode] = useState<StreamMode>('DEMO_CRICKET');
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

  // Active Adaptation Overlays
  const [reflowRegion, setReflowRegion] = useState<SemanticRegion | null>(null);
  const [isReflowOpen, setIsReflowOpen] = useState<boolean>(false);
  const [pinnedHUDRegions, setPinnedHUDRegions] = useState<SemanticRegion[]>([]);

  // Telemetry & Modals
  const [fps, setFps] = useState<number>(60);
  const [gazeLatencyMs, setGazeLatencyMs] = useState<number>(16);
  const [awsLatencyMs, setAwsLatencyMs] = useState<number>(620);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // Math references (persist across renders)
  const kalmanFilterRef = useRef<GazeKalmanFilter2D>(new GazeKalmanFilter2D(0.08, 18.0));
  const intentClassifierRef = useRef<KinematicIntentClassifier>(
    new KinematicIntentClassifier(DEFAULT_PATHOLOGY.dwellThresholdMs, DEFAULT_PATHOLOGY.maxDispersionPx)
  );
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());

  // Handle Stream Mode Switch
  const handleSelectStreamMode = async (mode: StreamMode) => {
    // Stop existing media tracks
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }

    setStreamMode(mode);

    if (mode === 'DEMO_CRICKET') {
      setCurrentDemoScene(DEMO_SCENES[0]);
      setSemanticRegions(DEMO_SCENES[0].regions);
    } else if (mode === 'DEMO_LECTURE') {
      setCurrentDemoScene(DEMO_SCENES[1]);
      setSemanticRegions(DEMO_SCENES[1].regions);
    } else if (mode === 'DEMO_NEWS') {
      setCurrentDemoScene(DEMO_SCENES[2]);
      setSemanticRegions(DEMO_SCENES[2].regions);
    } else if (mode === 'SCREEN_CAPTURE') {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        setMediaStream(stream);
        setCurrentDemoScene(null);
        // Default sample regions for live screen
        setSemanticRegions(DEMO_SCENES[2].regions);
      } catch {
        // Fallback if permission rejected
        setStreamMode('DEMO_CRICKET');
        setCurrentDemoScene(DEMO_SCENES[0]);
      }
    } else if (mode === 'WEBCAM') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setMediaStream(stream);
        setCurrentDemoScene(null);
        setSemanticRegions([
          {
            id: 'webcam_face_focus',
            type: 'FACIAL_PORTRAIT',
            confidence: 0.99,
            boundingBox: { left: 0.35, top: 0.20, width: 0.30, height: 0.50 },
            textContent: 'User / Presenter Webcam Face Feed',
            adaptationStrategy: {
              action: 'SUPER_RESOLVE_AND_STABILIZE',
              contrastBoost: 1.4,
              edgeSharpen: true
            }
          }
        ]);
      } catch {
        setStreamMode('DEMO_CRICKET');
        setCurrentDemoScene(DEMO_SCENES[0]);
      }
    }
  };

  // Process Gaze Coordinate
  const handleProcessGaze = useCallback((x: number, y: number) => {
    const t0 = performance.now();

    // 1. Smooth via 2D Discrete Kalman Filter
    const smoothed = kalmanFilterRef.current.update(x, y, t0);
    setSmoothedGaze({ x: smoothed.x, y: smoothed.y });

    // 2. Classify via I-VDT State Machine
    const w = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const h = typeof window !== 'undefined' ? window.innerHeight : 1080;

    const classification = intentClassifierRef.current.processPoint(
      smoothed,
      semanticRegions,
      w,
      h,
      t0
    );

    setKinematicState(classification.state);
    setDwellProgress(classification.dwellProgress);
    setActiveFocusedRegion(classification.activeRegion);

    // 3. Trigger Adaptation on Dwell Complete (>= 1.0)
    if (classification.dwellProgress >= 1.0 && classification.activeRegion) {
      const region = classification.activeRegion;
      audioHaptics.playLockChime();

      if (region.type === 'TEXT_BLOCK') {
        setReflowRegion(region);
        setIsReflowOpen(true);
      } else if (region.type === 'PERSISTENT_HUD') {
        // Automatically pin HUD if not already pinned
        if (!pinnedHUDRegions.some(r => r.id === region.id)) {
          setPinnedHUDRegions(prev => [...prev, region]);
        }
      }
    }

    setGazeLatencyMs(Math.round(performance.now() - t0));
  }, [semanticRegions, pinnedHUDRegions]);

  // Mouse Simulation Pointer
  const handleMouseMoveSimulate = (x: number, y: number) => {
    setRawGaze({ x, y });
    handleProcessGaze(x, y);
  };

  // Keyboard Shortcuts & Numpad 1–9 Matrix
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid hotkeys when typing in input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const w = window.innerWidth;
      const h = window.innerHeight;

      // Numpad 1–9 Gaze Matrix Simulation
      const numpadMap: Record<string, { x: number; y: number }> = {
        'Numpad7': { x: w * 0.20, y: h * 0.20 }, // Top-Left
        'Numpad8': { x: w * 0.50, y: h * 0.20 }, // Top-Center
        'Numpad9': { x: w * 0.80, y: h * 0.20 }, // Top-Right
        'Numpad4': { x: w * 0.20, y: h * 0.50 }, // Middle-Left
        'Numpad5': { x: w * 0.50, y: h * 0.50 }, // Center
        'Numpad6': { x: w * 0.80, y: h * 0.50 }, // Middle-Right
        'Numpad1': { x: w * 0.20, y: h * 0.80 }, // Bottom-Left
        'Numpad2': { x: w * 0.50, y: h * 0.85 }, // Bottom-Center (News chyron)
        'Numpad3': { x: w * 0.80, y: h * 0.80 }  // Bottom-Right
      };

      if (numpadMap[e.code]) {
        e.preventDefault();
        const target = numpadMap[e.code];
        setRawGaze(target);
        // Force rapid jumps through Kalman
        kalmanFilterRef.current.reset(target.x, target.y);
        handleProcessGaze(target.x, target.y);
        return;
      }

      // Spacebar: Freeze Frame
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFrozen(prev => !prev);
        return;
      }

      // 'C': Cycle Contrast Palette
      if (e.key === 'c' || e.key === 'C') {
        const presets: ContrastPreset[] = ['AMBER', 'CYAN', 'MINT', 'INVERT'];
        setContrastPreset(prev => {
          const next = presets[(presets.indexOf(prev) + 1) % presets.length];
          return next;
        });
        return;
      }

      // 'P': Cycle Pathology Mode
      if (e.key === 'p' || e.key === 'P') {
        const types: PathologyConfig['type'][] = ['AMD', 'TUNNEL_VISION', 'LOW_ACUITY', 'HEMIANOPIA'];
        setPathologyConfig(prev => {
          const nextType = types[(types.indexOf(prev.type) + 1) % types.length];
          return {
            ...prev,
            type: nextType
          };
        });
        return;
      }

      // 'S': Toggle Caregiver Simulator
      if (e.key === 's' || e.key === 'S') {
        setSimulatorActive(prev => !prev);
        return;
      }

      // 'T': Read Aloud Active Region
      if ((e.key === 't' || e.key === 'T') && activeFocusedRegion?.textContent) {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(activeFocusedRegion.textContent);
          window.speechSynthesis.speak(utterance);
        }
        return;
      }

      // '+' or '=': Increase Font Scale
      if (e.key === '+' || e.key === '=') {
        setFontScale(prev => Math.min(3.0, prev + 0.25));
        return;
      }

      // '-': Decrease Font Scale
      if (e.key === '-' || e.key === '_') {
        setFontScale(prev => Math.max(1.0, prev - 0.25));
        return;
      }

      // 'Escape': Close Reflow Drawer or Modals
      if (e.key === 'Escape') {
        setIsReflowOpen(false);
        setIsHelpModalOpen(false);
        return;
      }

      // '?': Open Keyboard Shortcuts
      if (e.key === '?') {
        setIsHelpModalOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleProcessGaze, activeFocusedRegion]);

  // 60 FPS Counter loop
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

  const themeClass = `theme-${contrastPreset.toLowerCase()}`;

  return (
    <main className={`relative flex h-screen w-screen flex-col overflow-hidden bg-canvas ${themeClass}`}>
      {/* Screen Reader ARIA Live Announcer */}
      <div 
        id="focalpoint-announcer" 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {activeFocusedRegion?.textContent ? `Fixated: ${activeFocusedRegion.textContent}` : ''}
      </div>

      {/* Top Telemetry Header */}
      <TelemetryBar
        fps={fps}
        gazeLatencyMs={gazeLatencyMs}
        awsLatencyMs={awsLatencyMs}
        kinematicState={kinematicState}
        activePathology={pathologyConfig.type}
        onPathologyChange={(type) => setPathologyConfig(prev => ({ ...prev, type }))}
        simulatorActive={simulatorActive}
        onToggleSimulator={() => setSimulatorActive(prev => !prev)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
      />

      {/* Stream Source Selector Sub-Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/60 px-4 py-2">
        <StreamSourceSelector
          currentMode={streamMode}
          onSelectMode={handleSelectStreamMode}
          isStreaming={!!mediaStream}
        />

        <div className="flex items-center gap-2 text-xs text-slate-400">
          {isFrozen && (
            <span className="flex items-center gap-1 rounded bg-amber-400/20 px-2 py-0.5 font-bold text-amber-highlight">
              [PAUSED / FROZEN]
            </span>
          )}
          <span className="hidden md:inline font-telemetry">
            Hover mouse or use Numpad 1–9 to direct gaze
          </span>
        </div>
      </div>

      {/* Primary Adaptive Viewport Stage */}
      <div className="relative flex flex-1 overflow-hidden">
        <AdaptiveViewport
          mediaStream={mediaStream}
          demoScene={currentDemoScene}
          semanticRegions={semanticRegions}
          activePathology={pathologyConfig}
          gazePoint={smoothedGaze}
          kinematicState={kinematicState}
          dwellProgress={dwellProgress}
          activeFocusedRegion={activeFocusedRegion}
          onRegionDwellComplete={(region) => {
            if (region.type === 'TEXT_BLOCK') {
              setReflowRegion(region);
              setIsReflowOpen(true);
            }
          }}
          onPinHUD={(region) => {
            if (!pinnedHUDRegions.some(r => r.id === region.id)) {
              audioHaptics.playLockChime();
              setPinnedHUDRegions(prev => [...prev, region]);
            }
          }}
          isFrozen={isFrozen}
          onMouseMoveSimulate={handleMouseMoveSimulate}
        />
      </div>

      {/* Pinned Peripheral HUD Overlay */}
      <PersistentHUDOverlay
        pinnedRegions={pinnedHUDRegions}
        onUnpin={(id) => setPinnedHUDRegions(prev => prev.filter(r => r.id !== id))}
      />

      {/* Dynamic Text Reflow Drawer */}
      <ReflowDrawer
        isOpen={isReflowOpen}
        region={reflowRegion}
        contrastPreset={contrastPreset}
        onContrastChange={setContrastPreset}
        fontScale={fontScale}
        onFontScaleChange={setFontScale}
        onClose={() => setIsReflowOpen(false)}
      />

      {/* Caregiver & Evaluator Pathology Simulator */}
      <PathologySimulator
        isEnabled={simulatorActive}
        pathologyType={pathologyConfig.type}
        gazePoint={smoothedGaze}
        scotomaRadiusPx={pathologyConfig.scotomaRadiusPx}
        tunnelRadiusPx={pathologyConfig.tunnelRadiusPx}
        onToggle={setSimulatorActive}
      />

      {/* Keyboard Shortcuts Accessibility Guide */}
      <KeyboardShortcutsModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </main>
  );
}
