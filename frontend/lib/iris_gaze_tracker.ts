/**
 * Direct Iris Geometric Gaze Estimator
 * 
 * Extracts real-time iris center and eye contour landmarks from MediaPipe FaceMesh
 * and computes direct horizontal & vertical gaze ratios.
 * 
 * Operates on frame 1 with zero manual calibration required, and continuously
 * adapts its baseline center offset as the user interacts with the application.
 */

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

  // Sensitivity amplification gains
  private gainX: number = 3.2;
  private gainY: number = 3.8;

  // Exponential moving average smoothing
  private smoothedScreenX: number | null = null;
  private smoothedScreenY: number | null = null;
  private readonly alpha: number = 0.35; // Responsive yet smooth

  // Calibration point memory
  private sampleCount: number = 0;

  /**
   * Landmark Indices from Google MediaPipe FaceMesh (with Iris model):
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
   * 4:   Nose Tip (reference)
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

    // If iris center 473/468 is not available, fall back to average of iris contour
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
      noseTip: getPt(4) || undefined
    };
  }

  /**
   * Computes normalized horizontal and vertical iris ratios from eye landmarks.
   */
  public computeGaze(
    positions: any, 
    screenWidth: number = 1920, 
    screenHeight: number = 1080
  ): GazeRatioResult | null {
    const pts = this.extractLandmarks(positions);
    if (!pts) return null;

    // 1. Left Eye Ratios (Camera perspective: viewer's left eye)
    const leftWidth = Math.abs(pts.leftInner.x - pts.leftOuter.x);
    const leftHeight = Math.abs(pts.leftBottom.y - pts.leftTop.y);
    if (leftWidth < 4 || leftHeight < 2) return null;

    const leftH = (pts.leftIris.x - Math.min(pts.leftOuter.x, pts.leftInner.x)) / leftWidth;
    const leftV = (pts.leftIris.y - Math.min(pts.leftTop.y, pts.leftBottom.y)) / leftHeight;

    // 2. Right Eye Ratios (Viewer's right eye)
    const rightWidth = Math.abs(pts.rightOuter.x - pts.rightInner.x);
    const rightHeight = Math.abs(pts.rightBottom.y - pts.rightTop.y);
    if (rightWidth < 4 || rightHeight < 2) return null;

    const rightH = (pts.rightIris.x - Math.min(pts.rightInner.x, pts.rightOuter.x)) / rightWidth;
    const rightV = (pts.rightIris.y - Math.min(pts.rightTop.y, pts.rightBottom.y)) / rightHeight;

    // 3. Combined Mean Ratios
    const rawH = (leftH + rightH) / 2;
    const rawV = (leftV + rightV) / 2;

    // 4. Map Gaze Ratio to Screen Coordinates
    // Horizontal: In mirrored webcam, looking screen-left moves iris in mirrored direction
    const deltaH = (rawH - this.centerH) * this.gainX;
    const deltaV = (rawV - this.centerV) * this.gainY;

    let targetX = screenWidth * (0.5 + deltaH);
    let targetY = screenHeight * (0.5 + deltaV);

    // Clamp to screen bounds
    targetX = Math.max(0, Math.min(screenWidth, targetX));
    targetY = Math.max(0, Math.min(screenHeight, targetY));

    // 5. Exponential Smoothing Filter
    if (this.smoothedScreenX === null || this.smoothedScreenY === null) {
      this.smoothedScreenX = targetX;
      this.smoothedScreenY = targetY;
    } else {
      this.smoothedScreenX = this.smoothedScreenX + this.alpha * (targetX - this.smoothedScreenX);
      this.smoothedScreenY = this.smoothedScreenY + this.alpha * (targetY - this.smoothedScreenY);
    }

    this.sampleCount++;

    return {
      horizontal: rawH,
      vertical: rawV,
      screenX: Math.round(this.smoothedScreenX),
      screenY: Math.round(this.smoothedScreenY),
      confidence: 0.92
    };
  }

  /**
   * Adapts center baseline whenever a known user interaction occurs (e.g. clicking or fixating)
   */
  public calibrateBaseline(rawH: number, rawV: number): void {
    if (rawH > 0.2 && rawH < 0.8 && rawV > 0.2 && rawV < 0.8) {
      // Soft adaptation toward observed neutral center
      this.centerH = this.centerH * 0.7 + rawH * 0.3;
      this.centerV = this.centerV * 0.7 + rawV * 0.3;
    }
  }

  public reset(): void {
    this.smoothedScreenX = null;
    this.smoothedScreenY = null;
    this.sampleCount = 0;
  }
}

export const irisGazeTracker = new IrisGazeTracker();
