/**
 * Direct Iris Geometric Gaze Estimator with 1-Euro Adaptive Filtering & Head-Pose Decoupling
 * 
 * Extracts real-time iris center (MediaPipe 468 & 473) and eye contour landmarks,
 * provides dark-pupil computer vision fallback for unrefined models,
 * decouples 3D head yaw/pitch, and maps natural ocular movement across 16:9 displays
 * with an ergonomic cubic response curve and automatic initial baseline tare.
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
  isRefinedIris: boolean;
}

export interface GazeRatioResult {
  horizontal: number; // ~0.0 (far left) to 1.0 (far right), 0.5 is center
  vertical: number;   // ~0.0 (top) to 1.0 (bottom), 0.5 is center
  screenX: number;
  screenY: number;
  normalizedX: number; // 0.0 to 1.0 across viewport
  normalizedY: number; // 0.0 to 1.0 across viewport
  confidence: number;
  isRefinedIris: boolean;
  landmarks?: EyeLandmarkPoints;
}

export class IrisGazeTracker {
  // Baseline neutral gaze offsets (auto-tared upon initialization)
  private centerH: number = 0.50;
  private centerV: number = 0.50;
  private autoTareSamples: { h: number; v: number }[] = [];
  private isAutoTared: boolean = false;

  // Ergonomic sensitivity amplification coefficients (cubic expansion)
  private gainX: number = 4.6;
  private nonLinearX: number = 15.0;
  private gainY: number = 5.2;
  private nonLinearY: number = 18.0;

  // Head-pose decoupling weights
  private headYawWeight: number = 0.40;
  private headPitchWeight: number = 0.35;

  // 1-Euro Adaptive Filter (minCutoff=1.0Hz for rock-solid fixation, beta=0.02 for fast saccades)
  private euroFilter: OneEuroFilter2D = new OneEuroFilter2D(1.0, 0.02, 1.0);

  // Last computed raw ratios for instant 1-tap center tare
  private lastRawH: number = 0.50;
  private lastRawV: number = 0.50;
  private lastExtractedLandmarks: EyeLandmarkPoints | null = null;
  private lastResult: GazeRatioResult | null = null;

  // Offscreen canvas for dark pupil computer vision fallback
  private scratchCanvas: HTMLCanvasElement | null = null;
  private scratchCtx: CanvasRenderingContext2D | null = null;

  /**
   * Landmark Indices from Google MediaPipe FaceMesh (with Refined Irises):
   * 
   * Right Eye (Subject's right / viewer's left in selfie mirror):
   * 468: Right Iris Center
   * 33:  Right Eye Outer Corner (Lateral canthus)
   * 133: Right Eye Inner Corner (Medial canthus)
   * 159: Right Upper Eyelid
   * 145: Right Lower Eyelid
   * 
   * Left Eye (Subject's left / viewer's right in selfie mirror):
   * 473: Left Iris Center
   * 362: Left Eye Inner Corner (Medial canthus)
   * 263: Left Eye Outer Corner (Lateral canthus)
   * 386: Left Upper Eyelid
   * 374: Left Lower Eyelid
   * 
   * Fiducial Head Pose References:
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

    // MediaPipe Refined Iris Centers
    let rightIris = getPt(468);
    let leftIris = getPt(473);
    const hasRefined = !!(rightIris && leftIris);

    // Anatomical Right Eye (Subject's Right)
    const rightOuter = getPt(33);
    const rightInner = getPt(133);
    const rightTop = getPt(159);
    const rightBottom = getPt(145);

    // Anatomical Left Eye (Subject's Left)
    const leftInner = getPt(362);
    const leftOuter = getPt(263);
    const leftTop = getPt(386);
    const leftBottom = getPt(374);

    if (!rightOuter || !rightInner || !rightTop || !rightBottom ||
        !leftOuter || !leftInner || !leftTop || !leftBottom) {
      return null;
    }

    // Computer Vision Dark-Pupil Fallback if iris model is not refined (468/473 missing)
    if (!rightIris || !leftIris) {
      const rightEstimated = this.estimatePupilCentroid(rightOuter, rightInner, rightTop, rightBottom);
      const leftEstimated = this.estimatePupilCentroid(leftOuter, leftInner, leftTop, leftBottom);
      rightIris = rightEstimated || {
        x: (rightOuter.x + rightInner.x) / 2,
        y: (rightTop.y + rightBottom.y) / 2
      };
      leftIris = leftEstimated || {
        x: (leftOuter.x + leftInner.x) / 2,
        y: (leftTop.y + leftBottom.y) / 2
      };
    }

    const landmarks: EyeLandmarkPoints = {
      rightIris,
      leftIris,
      rightOuter,
      rightInner,
      rightTop,
      rightBottom,
      leftInner,
      leftOuter,
      leftTop,
      leftBottom,
      noseTip: getPt(4) || undefined,
      noseBridge: getPt(168) || getPt(6) || undefined,
      faceLeft: getPt(454) || undefined,
      faceRight: getPt(234) || undefined,
      isRefinedIris: hasRefined
    };

    this.lastExtractedLandmarks = landmarks;
    return landmarks;
  }

  /**
   * Computer Vision Dark-Pupil Centroid Extractor:
   * Analyzes camera eye patch pixels to locate the darkest cluster (the iris/pupil)
   * if MediaPipe refined iris landmarks are absent or temporarily occluded.
   */
  private estimatePupilCentroid(
    outer: { x: number; y: number },
    inner: { x: number; y: number },
    top: { x: number; y: number },
    bottom: { x: number; y: number }
  ): { x: number; y: number } | null {
    if (typeof document === 'undefined') return null;

    try {
      const video = document.getElementById('webgazerVideoFeed') as HTMLVideoElement | null;
      if (!video || video.readyState < 2) return null;

      const minX = Math.min(outer.x, inner.x);
      const maxX = Math.max(outer.x, inner.x);
      const minY = Math.min(top.y, bottom.y);
      const maxY = Math.max(top.y, bottom.y);

      const width = Math.max(8, Math.round(maxX - minX));
      const height = Math.max(6, Math.round(maxY - minY));

      if (!this.scratchCanvas) {
        this.scratchCanvas = document.createElement('canvas');
        this.scratchCtx = this.scratchCanvas.getContext('2d', { willReadFrequently: true });
      }

      const canvas = this.scratchCanvas;
      const ctx = this.scratchCtx;
      if (!ctx) return null;

      canvas.width = width;
      canvas.height = height;

      // Draw eye patch from video
      ctx.drawImage(video, minX, minY, width, height, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // Calculate pixel intensity (grayscale)
      let minVal = 255;
      const intensities = new Float32Array(width * height);
      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        // Luminance Y = 0.299R + 0.587G + 0.114B
        const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        intensities[p] = y;
        if (y < minVal) minVal = y;
      }

      // Dark threshold: darkest 25% of the eye patch
      const threshold = minVal + 35;
      let sumWeight = 0;
      let sumX = 0;
      let sumY = 0;

      for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
          const val = intensities[py * width + px];
          if (val <= threshold) {
            const weight = (threshold - val + 1) ** 2;
            sumWeight += weight;
            sumX += px * weight;
            sumY += py * weight;
          }
        }
      }

      if (sumWeight > 0) {
        return {
          x: minX + sumX / sumWeight,
          y: minY + sumY / sumWeight
        };
      }
    } catch {}

    return null;
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

    // 1. Right Eye Ratios (Subject's right)
    const rightMinX = Math.min(pts.rightOuter.x, pts.rightInner.x);
    const rightMaxX = Math.max(pts.rightOuter.x, pts.rightInner.x);
    const rightWidth = rightMaxX - rightMinX;

    const rightMinY = Math.min(pts.rightTop.y, pts.rightBottom.y);
    const rightMaxY = Math.max(pts.rightTop.y, pts.rightBottom.y);
    const rightHeight = rightMaxY - rightMinY;

    if (rightWidth < 4 || rightHeight < 2) return null;

    const rightH = (pts.rightIris.x - rightMinX) / rightWidth;
    const rightV = (pts.rightIris.y - rightMinY) / rightHeight;

    // 2. Left Eye Ratios (Subject's left)
    const leftMinX = Math.min(pts.leftOuter.x, pts.leftInner.x);
    const leftMaxX = Math.max(pts.leftOuter.x, pts.leftInner.x);
    const leftWidth = leftMaxX - leftMinX;

    const leftMinY = Math.min(pts.leftTop.y, pts.leftBottom.y);
    const leftMaxY = Math.max(pts.leftTop.y, pts.leftBottom.y);
    const leftHeight = leftMaxY - leftMinY;

    if (leftWidth < 4 || leftHeight < 2) return null;

    const leftH = (pts.leftIris.x - leftMinX) / leftWidth;
    const leftV = (pts.leftIris.y - leftMinY) / leftHeight;

    // 3. Combined Mean Ratios
    const rawH = (rightH + leftH) / 2;
    const rawV = (rightV + leftV) / 2;
    this.lastRawH = rawH;
    this.lastRawV = rawV;

    // 4. Initial Auto-Tare on first 10 valid frames
    if (!this.isAutoTared && rawH > 0.25 && rawH < 0.75 && rawV > 0.25 && rawV < 0.75) {
      this.autoTareSamples.push({ h: rawH, v: rawV });
      if (this.autoTareSamples.length >= 10) {
        const sumH = this.autoTareSamples.reduce((acc, s) => acc + s.h, 0);
        const sumV = this.autoTareSamples.reduce((acc, s) => acc + s.v, 0);
        this.centerH = sumH / this.autoTareSamples.length;
        this.centerV = sumV / this.autoTareSamples.length;
        this.isAutoTared = true;
      }
    }

    // 5. Head-Pose Decoupling (compensates for head yaw & pitch)
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
      const eyeLevelY = (pts.rightInner.y + pts.leftInner.y) / 2;
      const noseLength = Math.abs(pts.noseTip.y - pts.noseBridge.y);
      if (noseLength > 5) {
        headPitchOffset = (pts.noseTip.y - eyeLevelY) / (noseLength * 2.5) - 0.40;
      }
    }

    // 6. Non-Linear Cubic Ergonomic Expansion Curve
    // Ocular geometry: In forward camera view, looking to screen RIGHT shifts irises to camera LEFT (smaller rawH).
    // Invert sign of horizontal ocular shift so looking right produces positive screen delta.
    const eyeH = -(rawH - this.centerH);
    const diffH = eyeH - headYawOffset * this.headYawWeight;

    // Looking UP towards screen top (smaller Y) shifts irises towards camera top (smaller rawV).
    const eyeV = (rawV - this.centerV);
    const diffV = eyeV + headPitchOffset * this.headPitchWeight;

    // Cubic expansion: small gaze shifts are steady; full saccades reach monitor extremities
    const signH = diffH >= 0 ? 1 : -1;
    const absH = Math.abs(diffH);
    const deltaH = signH * (this.gainX * absH + this.nonLinearX * (absH ** 2));

    const signV = diffV >= 0 ? 1 : -1;
    const absV = Math.abs(diffV);
    const deltaV = signV * (this.gainY * absV + this.nonLinearY * (absV ** 2));

    // 7. Map to Screen Coordinates & Normalized Viewport Coordinates [0, 1]
    const normX = Math.max(0, Math.min(1, 0.5 + deltaH));
    const normY = Math.max(0, Math.min(1, 0.5 + deltaV));

    let targetX = screenWidth * normX;
    let targetY = screenHeight * normY;

    // Screen Boundary Clamp
    targetX = Math.max(0, Math.min(screenWidth, targetX));
    targetY = Math.max(0, Math.min(screenHeight, targetY));

    // 8. 1-Euro Adaptive Filter (smooths stationary fixation, tracks fast saccades)
    const t = timestampMs ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const filtered = this.euroFilter.filter(targetX, targetY, t);

    // 9. Slow-drift baseline adaptation (gentle 0.1% tare update)
    if (this.isAutoTared && absH < 0.04 && absV < 0.04) {
      this.centerH = this.centerH * 0.998 + rawH * 0.002;
      this.centerV = this.centerV * 0.998 + rawV * 0.002;
    }

    const filteredNormX = screenWidth > 0 ? Math.max(0, Math.min(1, filtered.x / screenWidth)) : normX;
    const filteredNormY = screenHeight > 0 ? Math.max(0, Math.min(1, filtered.y / screenHeight)) : normY;

    const result: GazeRatioResult = {
      horizontal: rawH,
      vertical: rawV,
      screenX: Math.round(filtered.x),
      screenY: Math.round(filtered.y),
      normalizedX: filteredNormX,
      normalizedY: filteredNormY,
      confidence: pts.isRefinedIris ? 0.96 : 0.88,
      isRefinedIris: pts.isRefinedIris,
      landmarks: pts
    };

    this.lastResult = result;
    return result;
  }

  /**
   * Instantly tares / zeroes the neutral forward gaze baseline to the user's current eye position.
   */
  public tareCenter(): void {
    if (this.lastRawH > 0.20 && this.lastRawH < 0.80) {
      this.centerH = this.lastRawH;
    }
    if (this.lastRawV > 0.20 && this.lastRawV < 0.80) {
      this.centerV = this.lastRawV;
    }
    this.isAutoTared = true;
    this.euroFilter.reset();
  }

  /**
   * Returns the most recent extracted landmarks for live UI overlays
   */
  public getLastLandmarks(): EyeLandmarkPoints | null {
    return this.lastExtractedLandmarks;
  }

  /**
   * Returns the most recent gaze estimation result including real-time iris landmarks
   */
  public getLastResult(): GazeRatioResult | null {
    return this.lastResult;
  }

  /**
   * Softly adapts baseline toward observed neutral center
   */
  public calibrateBaseline(rawH: number, rawV: number): void {
    if (rawH > 0.25 && rawH < 0.75 && rawV > 0.25 && rawV < 0.75) {
      this.centerH = this.centerH * 0.85 + rawH * 0.15;
      this.centerV = this.centerV * 0.85 + rawV * 0.15;
    }
  }

  public reset(): void {
    this.euroFilter.reset();
    this.isAutoTared = false;
    this.autoTareSamples = [];
  }
}

export const irisGazeTracker = new IrisGazeTracker();
