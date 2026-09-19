/**
 * Direct Iris Geometric Gaze Estimator with 1-Euro Adaptive Filtering & Head-Pose Decoupling
 * 
 * Extracts real-time iris center and eye contour landmarks from MediaPipe FaceMesh,
 * compensates for 3D head yaw and pitch via facial fiducial vectors, and passes coordinates
 * through a 1-Euro adaptive filter for rock-solid low-speed fixation and zero-latency saccades.
 */

import { OneEuroFilter2D } from './one_euro_filter';

export interface EyeLandmarkPoints {
  leftIris: { x: number; y: number };
  rightIris: { x: number; y: number };
  leftInner: { x: number; y: number };
  leftOuter: { x: number; y: number };
  leftTop: { x: number; y: number };
  leftBottom: { x: number; y: number };
  rightInner: { x: number; y: number };
  rightOuter: { x: number; y: number };
  rightTop: { x: number; y: number };
  rightBottom: { x: number; y: number };
  noseTip?: { x: number; y: number };
  noseBridge?: { x: number; y: number };
  faceLeft?: { x: number; y: number };
  faceRight?: { x: number; y: number };
}

export interface GazeRatioResult {
  horizontal: number; // ~0.0 (far left) to 1.0 (far right), 0.5 is center
  vertical: number;   // ~0.0 (top) to 1.0 (bottom), 0.5 is center
  screenX: number;
  screenY: number;
  confidence: number;
}

export class IrisGazeTracker {
  // Baseline neutral gaze offsets
  private centerH: number = 0.50;
  private centerV: number = 0.50;

  // Calibrated ergonomic sensitivity amplification gains
  private gainX: number = 2.2;
  private gainY: number = 2.4;

  // Head-pose decoupling weights
  private headYawWeight: number = 0.45;
  private headPitchWeight: number = 0.35;

  // 1-Euro Adaptive Filter (minCutoff=0.9Hz for rock-solid fixation, beta=0.015 for fast saccades)
  private euroFilter: OneEuroFilter2D = new OneEuroFilter2D(0.9, 0.015, 1.0);

  // Last computed raw ratios for instant 1-tap center tare
  private lastRawH: number = 0.50;
  private lastRawV: number = 0.50;

  /**
   * Landmark Indices from Google MediaPipe FaceMesh:
   * 468: Right Iris Center
   * 473: Left Iris Center
   * 33:  Left Eye Outer Corner
   * 133: Left Eye Inner Corner
   * 159: Left Upper Eyelid
   * 145: Left Lower Eyelid
   * 362: Right Eye Inner Corner
   * 263: Right Eye Outer Corner
   * 386: Right Upper Eyelid
   * 374: Right Lower Eyelid
   * 4:   Nose Tip
   * 168: Nose Bridge (between eyes)
   * 234: Right Zygomatic cheek/ear boundary
   * 454: Left Zygomatic cheek/ear boundary
   */
  public extractLandmarks(positions: any): EyeLandmarkPoints | null {
    if (!positions || positions.length < 468) return null;

    const getPt = (idx: number): { x: number; y: number } | null => {
      const p = positions[idx];
      if (!p) return null;
      if (Array.isArray(p)) {
        return { x: p[0], y: p[1] };
      }
      if (typeof p.x === 'number' && typeof p.y === 'number') {
        return { x: p.x, y: p.y };
      }
      return null;
    };

    let leftIris = getPt(473);
    let rightIris = getPt(468);

    const leftOuter = getPt(33);
    const leftInner = getPt(133);
    const leftTop = getPt(159);
    const leftBottom = getPt(145);

    const rightInner = getPt(362);
    const rightOuter = getPt(263);
    const rightTop = getPt(386);
    const rightBottom = getPt(374);

    if (!leftOuter || !leftInner || !leftTop || !leftBottom ||
        !rightOuter || !rightInner || !rightTop || !rightBottom) {
      return null;
    }

    // Fallback if iris model is not refined: compute pupil as midpoint of eye opening
    if (!leftIris) {
      leftIris = {
        x: (leftOuter.x + leftInner.x) / 2,
        y: (leftTop.y + leftBottom.y) / 2
      };
    }
    if (!rightIris) {
      rightIris = {
        x: (rightInner.x + rightOuter.x) / 2,
        y: (rightTop.y + rightBottom.y) / 2
      };
    }

    return {
      leftIris,
      rightIris,
      leftInner,
      leftOuter,
      leftTop,
      leftBottom,
      rightInner,
      rightOuter,
      rightTop,
      rightBottom,
      noseTip: getPt(4) || undefined,
      noseBridge: getPt(168) || getPt(6) || undefined,
      faceLeft: getPt(454) || undefined,
      faceRight: getPt(234) || undefined
    };
  }

  /**
   * Computes normalized horizontal and vertical iris ratios from eye landmarks
   * with head-pose decoupling and 1-Euro adaptive filtering.
   */
  public computeGaze(
    positions: any, 
    screenWidth: number = 1920, 
    screenHeight: number = 1080,
    timestampMs?: number
  ): GazeRatioResult | null {
    const pts = this.extractLandmarks(positions);
    if (!pts) return null;

    // 1. Left Eye Ratios (Camera perspective)
    const leftWidth = Math.abs(pts.leftInner.x - pts.leftOuter.x);
    const leftHeight = Math.abs(pts.leftBottom.y - pts.leftTop.y);
    if (leftWidth < 4 || leftHeight < 2) return null;

    const leftH = (pts.leftIris.x - Math.min(pts.leftOuter.x, pts.leftInner.x)) / leftWidth;
    const leftV = (pts.leftIris.y - Math.min(pts.leftTop.y, pts.leftBottom.y)) / leftHeight;

    // 2. Right Eye Ratios
    const rightWidth = Math.abs(pts.rightOuter.x - pts.rightInner.x);
    const rightHeight = Math.abs(pts.rightBottom.y - pts.rightTop.y);
    if (rightWidth < 4 || rightHeight < 2) return null;

    const rightH = (pts.rightIris.x - Math.min(pts.rightInner.x, pts.rightOuter.x)) / rightWidth;
    const rightV = (pts.rightIris.y - Math.min(pts.rightTop.y, pts.rightBottom.y)) / rightHeight;

    // 3. Combined Mean Ratios
    const rawH = (leftH + rightH) / 2;
    const rawV = (leftV + rightV) / 2;
    this.lastRawH = rawH;
    this.lastRawV = rawV;

    // 4. Head-Pose Decoupling (compensates for head yaw & pitch)
    let headYawOffset = 0;
    let headPitchOffset = 0;

    if (pts.noseTip && pts.faceLeft && pts.faceRight) {
      const faceWidth = Math.abs(pts.faceLeft.x - pts.faceRight.x);
      if (faceWidth > 20) {
        const faceMidX = (pts.faceLeft.x + pts.faceRight.x) / 2;
        headYawOffset = (pts.noseTip.x - faceMidX) / faceWidth;
      }
    }

    if (pts.noseTip && pts.noseBridge) {
      const eyeLevelY = (pts.leftInner.y + pts.rightInner.y) / 2;
      const noseLength = Math.abs(pts.noseTip.y - pts.noseBridge.y);
      if (noseLength > 5) {
        headPitchOffset = (pts.noseTip.y - eyeLevelY) / (noseLength * 2.5) - 0.40;
      }
    }

    // 5. Delta from neutral center minus head tilt
    const deltaH = (rawH - this.centerH - headYawOffset * this.headYawWeight) * this.gainX;
    const deltaV = (rawV - this.centerV - headPitchOffset * this.headPitchWeight) * this.gainY;

    // 6. Map to Screen Coordinates
    let targetX = screenWidth * (0.5 + deltaH);
    let targetY = screenHeight * (0.5 + deltaV);

    // Screen Boundary Clamp
    targetX = Math.max(0, Math.min(screenWidth, targetX));
    targetY = Math.max(0, Math.min(screenHeight, targetY));

    // 7. 1-Euro Adaptive Filter (smooths stationary fixation, tracks fast saccades)
    const t = timestampMs ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const filtered = this.euroFilter.filter(targetX, targetY, t);

    return {
      horizontal: rawH,
      vertical: rawV,
      screenX: Math.round(filtered.x),
      screenY: Math.round(filtered.y),
      confidence: 0.94
    };
  }

  /**
   * Instantly tares / zeroes the neutral forward gaze baseline to the user's current eye position.
   */
  public tareCenter(): void {
    if (this.lastRawH > 0.25 && this.lastRawH < 0.75) {
      this.centerH = this.lastRawH;
    }
    if (this.lastRawV > 0.25 && this.lastRawV < 0.75) {
      this.centerV = this.lastRawV;
    }
    this.euroFilter.reset();
  }

  /**
   * Softly adapts baseline toward observed neutral center
   */
  public calibrateBaseline(rawH: number, rawV: number): void {
    if (rawH > 0.3 && rawH < 0.7 && rawV > 0.3 && rawV < 0.7) {
      this.centerH = this.centerH * 0.85 + rawH * 0.15;
      this.centerV = this.centerV * 0.85 + rawV * 0.15;
    }
  }

  public reset(): void {
    this.euroFilter.reset();
  }
}

export const irisGazeTracker = new IrisGazeTracker();
