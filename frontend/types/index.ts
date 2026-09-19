/**
 * FocalPoint Domain Type Definitions
 * Ophthalmic visual parameters, eye kinematics, and semantic reconstruction contracts.
 */

export type PathologyType = 'AMD' | 'TUNNEL_VISION' | 'LOW_ACUITY' | 'HEMIANOPIA';

export type KinematicState = 'SACCADE' | 'FIXATION' | 'SMOOTH_PURSUIT';

export type ContrastPreset = 'AMBER' | 'CYAN' | 'MINT' | 'INVERT';

export interface BoundingBox {
  left: number;   // 0.0 - 1.0 (normalized)
  top: number;    // 0.0 - 1.0 (normalized)
  width: number;  // 0.0 - 1.0 (normalized)
  height: number; // 0.0 - 1.0 (normalized)
}

export type SemanticRegionType = 
  | 'TEXT_BLOCK' 
  | 'FACIAL_PORTRAIT' 
  | 'PERSISTENT_HUD' 
  | 'ACTION_ZONE'
  | 'ATHLETE_TRACK'
  | 'INFOGRAPHIC'
  | 'BACKGROUND_CONTEXT';

export interface DynamicReflowStrategy {
  action: 'DYNAMIC_REFLOW';
  typography: {
    preferredFont: string;
    fontSizeRem: number;
    fontWeight: string;
    highContrastTheme: string;
  };
}

export interface FaceStabilizeStrategy {
  action: 'SUPER_RESOLVE_AND_STABILIZE';
  contrastBoost: number;
  edgeSharpen: boolean;
}

export interface PinHUDStrategy {
  action: 'PIN_TO_PERIPHERY';
  anchorCorner: 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';
  scaleFactor: number;
}

export interface DesaturateStrategy {
  action: 'DESATURATE_AND_ATTENUATE';
  opacity: number;
}

export interface FoveatedZoomStrategy {
  action: 'FOVEATED_OPTICAL_ZOOM';
  zoomLevel: number;
  isolationMode: 'SPOTLIGHT' | 'PERIPHERAL_DOCK' | 'FULL_ZOOM';
}

export type AdaptationStrategy = 
  | DynamicReflowStrategy 
  | FaceStabilizeStrategy 
  | PinHUDStrategy 
  | DesaturateStrategy
  | FoveatedZoomStrategy
  | { action: string; [key: string]: any };

export interface SemanticRegion {
  id: string;
  type: SemanticRegionType;
  boundingBox: BoundingBox;
  confidence: number;
  textContent?: string;
  label?: string;
  zoomLevel?: number;
  isolationMode?: 'SPOTLIGHT' | 'PERIPHERAL_DOCK' | 'FULL_ZOOM';
  extractedMetrics?: Record<string, string>;
  attributes?: {
    mouthOpen?: boolean;
    dominantEmotion?: string;
    [key: string]: any;
  };
  adaptationStrategy: AdaptationStrategy;
}

export interface GazePoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface FilteredGaze {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number; // px/sec
}

export interface KinematicClassificationResult {
  state: KinematicState;
  activeRegion: SemanticRegion | null;
  dwellProgress: number; // 0.0 to 1.0
  dispersionPx: number;
  velocityPxPerSec: number;
}

export interface PathologyConfig {
  type: PathologyType;
  description: string;
  dwellThresholdMs: number;
  maxDispersionPx: number;
  preferredContrastTheme: ContrastPreset;
  fontScaleRem: number;
  prlOffset: { x: number; y: number }; // In pixels, for AMD eccentric viewing
  scotomaRadiusPx: number;            // For AMD central scotoma simulation
  tunnelRadiusPx: number;             // For Retinitis Pigmentosa tunnel vision
  audioHapticEnabled: boolean;
}

export interface FrameAnalysisPayload {
  frameId: string;
  processedAt: string;
  processingLatencyMs: number;
  dimensions: { width: number; height: number };
  userProfileSummary?: {
    pathologyType: string;
    dwellThresholdMs: number;
  };
  regions: SemanticRegion[];
}

export type StreamMode = 
  | 'AWS_SERVERLESS' 
  | 'DEMO_CRICKET' 
  | 'DEMO_LECTURE' 
  | 'DEMO_NEWS' 
  | 'CUSTOM_UPLOAD' 
  | 'SCREEN_CAPTURE' 
  | 'YOUTUBE_URL';

export interface DemoScene {
  id: string;
  title: string;
  category: 'AWS Cloud Lecture' | 'Sports Broadcast' | 'Academic Lecture' | 'Breaking News';
  description: string;
  aspectRatio: string;
  videoUrl?: string;
  canvasRender?: (ctx: CanvasRenderingContext2D, width: number, height: number, frameTime: number) => void;
  regions: SemanticRegion[];
}

