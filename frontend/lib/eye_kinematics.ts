/**
 * I-VDT (Identification by Velocity & Dispersion Threshold) Kinematic Intent Classifier
 * 
 * Classifies continuous gaze stream into:
 * - SACCADE: Involuntary rapid eye jump (suppress UI updates to prevent Midas Touch)
 * - FIXATION: Stable dwell on a semantic region (accumulates dwell progress)
 * - SMOOTH_PURSUIT: Tracking moving elements (sticky target lock)
 */

import { 
  GazePoint, 
  KinematicState, 
  SemanticRegion, 
  KinematicClassificationResult 
} from '../types';

export class KinematicIntentClassifier {
  private windowBuffer: GazePoint[] = [];
  private windowDurationMs: number = 220;
  private maxDispersionPx: number = 65;
  private dwellThresholdMs: number = 280;
  private saccadeVelocityThresholdPxSec: number = 550; // roughly ~250-300 deg/sec on typical display

  private currentState: KinematicState = 'SACCADE';
  private currentFocusedRegionId: string | null = null;
  private dwellAccumulatorMs: number = 0;
  private lastTimestamp: number = 0;

  constructor(
    dwellThresholdMs: number = 280, 
    maxDispersionPx: number = 65,
    windowDurationMs: number = 220
  ) {
    this.dwellThresholdMs = dwellThresholdMs;
    this.maxDispersionPx = maxDispersionPx;
    this.windowDurationMs = windowDurationMs;
  }

  public setDwellThreshold(ms: number): void {
    this.dwellThresholdMs = Math.max(150, Math.min(1000, ms));
  }

  public setMaxDispersion(px: number): void {
    this.maxDispersionPx = Math.max(30, Math.min(150, px));
  }

  public reset(): void {
    this.windowBuffer = [];
    this.currentState = 'SACCADE';
    this.currentFocusedRegionId = null;
    this.dwellAccumulatorMs = 0;
    this.lastTimestamp = 0;
  }

  /**
   * Processes a single gaze point against visible semantic regions.
   */
  public processPoint(
    point: { x: number; y: number },
    regions: SemanticRegion[],
    viewportWidth: number,
    viewportHeight: number,
    currentTimestamp?: number
  ): KinematicClassificationResult {
    const now = currentTimestamp ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const gazeSample: GazePoint = { x: point.x, y: point.y, timestamp: now };
    this.windowBuffer.push(gazeSample);

    // Evict expired samples outside sliding window
    while (this.windowBuffer.length > 0 && now - this.windowBuffer[0].timestamp > this.windowDurationMs) {
      this.windowBuffer.shift();
    }

    const dt = this.lastTimestamp > 0 ? (now - this.lastTimestamp) : 16;
    this.lastTimestamp = now;

    if (this.windowBuffer.length < 3) {
      return {
        state: 'SACCADE',
        activeRegion: null,
        dwellProgress: 0,
        dispersionPx: 0,
        velocityPxPerSec: 0
      };
    }

    // 1. Calculate Spatial Dispersion D(W)
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (let i = 0; i < this.windowBuffer.length; i++) {
      const p = this.windowBuffer[i];
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const dispersionPx = (maxX - minX) + (maxY - minY);

    // 2. Calculate Instantaneous Velocity
    const oldest = this.windowBuffer[0];
    const newest = this.windowBuffer[this.windowBuffer.length - 1];
    const timeDeltaSec = (newest.timestamp - oldest.timestamp) / 1000.0;
    const distPx = Math.sqrt(Math.pow(newest.x - oldest.x, 2) + Math.pow(newest.y - oldest.y, 2));
    const velocityPxPerSec = timeDeltaSec > 0 ? distPx / timeDeltaSec : 0;

    // 3. I-VDT State Decision Logic
    const isStationary = dispersionPx <= this.maxDispersionPx;
    const isRapidJump = velocityPxPerSec >= this.saccadeVelocityThresholdPxSec;

    if (!isStationary || isRapidJump) {
      this.currentState = 'SACCADE';
      this.resetDwell();
      return {
        state: 'SACCADE',
        activeRegion: null,
        dwellProgress: 0,
        dispersionPx,
        velocityPxPerSec
      };
    }

    // Enter or remain in FIXATION
    this.currentState = 'FIXATION';
    const centroidX = (minX + maxX) / 2;
    const centroidY = (minY + maxY) / 2;

    // Convert centroid to normalized coordinates
    const normX = viewportWidth > 0 ? centroidX / viewportWidth : 0.5;
    const normY = viewportHeight > 0 ? centroidY / viewportHeight : 0.5;

    // Determine if gaze intersects any foreground semantic region
    // Prioritize specific elements (HUD, Text, Face) over generic background
    const interactiveRegions = regions.filter(r => r.type !== 'BACKGROUND_CONTEXT');
    const targetRegion = interactiveRegions.find(r => {
      const b = r.boundingBox;
      return (
        normX >= b.left &&
        normX <= b.left + b.width &&
        normY >= b.top &&
        normY <= b.top + b.height
      );
    });

    if (targetRegion) {
      if (this.currentFocusedRegionId === targetRegion.id) {
        this.dwellAccumulatorMs += dt;
      } else {
        // Gaze switched to a different region: restart accumulation
        this.currentFocusedRegionId = targetRegion.id;
        this.dwellAccumulatorMs = dt;
      }

      const progress = Math.min(1.0, this.dwellAccumulatorMs / this.dwellThresholdMs);

      return {
        state: 'FIXATION',
        activeRegion: targetRegion,
        dwellProgress: progress,
        dispersionPx,
        velocityPxPerSec
      };
    }

    // Fixating on empty space or background
    this.resetDwell();
    return {
      state: 'FIXATION',
      activeRegion: null,
      dwellProgress: 0,
      dispersionPx,
      velocityPxPerSec
    };
  }

  private resetDwell(): void {
    this.currentFocusedRegionId = null;
    this.dwellAccumulatorMs = 0;
  }

  public getCurrentState(): KinematicState {
    return this.currentState;
  }
}
