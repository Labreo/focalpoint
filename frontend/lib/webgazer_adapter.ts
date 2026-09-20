/**
 * WebGazer.js Real Webcam Eye-Tracking Adapter for FocalPoint
 * 
 * Dynamically loads and binds WebGazer.js to the user's webcam feed.
 * Records 9-point polynomial calibration points and pipes continuous
 * gaze predictions into the 2D Kalman Filter and I-VDT Kinematic state machine.
 */

declare global {
  interface Window {
    webgazer: any;
  }
}

import { irisGazeTracker, GazeRatioResult } from './iris_gaze_tracker';

export type GazeCallback = (x: number, y: number, normX?: number, normY?: number) => void;

class WebGazerManager {
  private isLoaded: boolean = false;
  private isRunning: boolean = false;
  private gazeCallback: GazeCallback | null = null;
  private cameraPreviewVisible: boolean = true;
  private watchdogTimer: any = null;

  /**
   * Dynamically injects WebGazer.js from local bundle if not present in window
   */
  public async loadScript(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (window.webgazer) {
      this.isLoaded = true;
      return true;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = '/webgazer.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.isLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        console.warn('Local webgazer.js failed, falling back to Brown CDN');
        const fallback = document.createElement('script');
        fallback.src = 'https://webgazer.cs.brown.edu/webgazer.js';
        fallback.onload = () => {
          this.isLoaded = true;
          resolve(true);
        };
        fallback.onerror = () => {
          this.isLoaded = false;
          resolve(false);
        };
        document.head.appendChild(fallback);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Initializes script loading
   */
  public async init(): Promise<boolean> {
    return this.loadScript();
  }

  /**
   * Draws real-time visual iris tracking indicators on the webcam canvas overlay
   */
  private drawIrisOverlay(irisResult: GazeRatioResult): void {
    if (typeof document === 'undefined') return;
    const overlay = document.getElementById('webgazerFaceOverlay') as HTMLCanvasElement | null;
    const feed = document.getElementById('webgazerVideoFeed') as HTMLVideoElement | null;
    if (!overlay || !feed || !feed.videoWidth || !feed.videoHeight) return;

    if (overlay.width !== feed.videoWidth) overlay.width = feed.videoWidth;
    if (overlay.height !== feed.videoHeight) overlay.height = feed.videoHeight;

    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const lm = irisResult.landmarks;
    if (lm) {
      // Draw Right Iris (Subject's right / viewer's left in selfie mirror)
      ctx.beginPath();
      ctx.arc(lm.rightIris.x, lm.rightIris.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#F59E0B'; // Amber
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw Left Iris (Subject's left / viewer's right in selfie mirror)
      ctx.beginPath();
      ctx.arc(lm.leftIris.x, lm.leftIris.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#06B6D4'; // Cyan
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw eye contour outlines
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
      ctx.lineWidth = 1;

      // Right eye: outer -> top -> inner -> bottom -> outer
      ctx.beginPath();
      ctx.moveTo(lm.rightOuter.x, lm.rightOuter.y);
      ctx.lineTo(lm.rightTop.x, lm.rightTop.y);
      ctx.lineTo(lm.rightInner.x, lm.rightInner.y);
      ctx.lineTo(lm.rightBottom.x, lm.rightBottom.y);
      ctx.closePath();
      ctx.stroke();

      // Left eye: inner -> top -> outer -> bottom -> inner
      ctx.beginPath();
      ctx.moveTo(lm.leftInner.x, lm.leftInner.y);
      ctx.lineTo(lm.leftTop.x, lm.leftTop.y);
      ctx.lineTo(lm.leftOuter.x, lm.leftOuter.y);
      ctx.lineTo(lm.leftBottom.x, lm.leftBottom.y);
      ctx.closePath();
      ctx.stroke();
    }

    // Top HUD Telemetry Bar on video preview
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, overlay.width, 22);

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = irisResult.isRefinedIris ? '#10B981' : '#F59E0B';
    const tag = irisResult.isRefinedIris ? '● IRIS 468/473 LIVE' : '● PUPIL TRACK LIVE';
    ctx.fillText(tag, 6, 15);

    ctx.fillStyle = '#E4E4E7';
    ctx.fillText(`${irisResult.screenX}, ${irisResult.screenY}`, overlay.width - 80, 15);
  }

  /**
   * Dispatches direct geometric iris gaze coordinates from MediaPipe FaceMesh eye landmarks
   */
  public dispatchIrisFallback(): boolean {
    if (typeof window === 'undefined' || !window.webgazer) return false;
    try {
      const tracker = window.webgazer.getTracker ? window.webgazer.getTracker() : null;
      if (tracker && typeof tracker.getPositions === 'function') {
        const positions = tracker.getPositions();
        if (positions && positions.length >= 468) {
          const iris = irisGazeTracker.computeGaze(positions, window.innerWidth, window.innerHeight);
          if (iris && this.gazeCallback) {
            this.gazeCallback(iris.screenX, iris.screenY, iris.normalizedX, iris.normalizedY);
            this.drawIrisOverlay(iris);
            return true;
          }
        }
      }
    } catch {}
    return false;
  }

  private startWatchdog(): void {
    if (this.watchdogTimer) return;
    this.watchdogTimer = setInterval(() => {
      if (!this.isRunning || typeof window === 'undefined' || !window.webgazer) return;

      // Prioritize Direct Iris Geometric Landmark Tracker (reliable 30 FPS without manual click calibration)
      const dispatched = this.dispatchIrisFallback();
      if (!dispatched) {
        try {
          const pred = window.webgazer.getCurrentPrediction ? window.webgazer.getCurrentPrediction() : null;
          if (pred && pred.x != null && pred.y != null && !isNaN(pred.x) && !isNaN(pred.y)) {
            if (this.gazeCallback) {
              const normX = typeof window !== 'undefined' && window.innerWidth > 0 ? pred.x / window.innerWidth : 0.5;
              const normY = typeof window !== 'undefined' && window.innerHeight > 0 ? pred.y / window.innerHeight : 0.5;
              this.gazeCallback(pred.x, pred.y, normX, normY);
            }
          }
        } catch {}
      }
    }, 33); // 30 FPS continuous gaze loop
  }

  private stopWatchdog(): void {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  /**
   * Initializes WebGazer tracker and binds the continuous gaze listener
   */
  public async start(onGaze: GazeCallback, showPreview: boolean = true): Promise<boolean> {
    this.gazeCallback = onGaze;
    this.cameraPreviewVisible = showPreview;
    const loaded = await this.loadScript();
    if (!loaded || typeof window === 'undefined' || !window.webgazer) return false;

    try {
      // Configure ridge regression model and persistence
      window.webgazer.setRegression('ridge');
      window.webgazer.saveDataAcrossSessions(true);

      // Automatically listen to mouse events to auto-calibrate on cursor movements
      if (typeof window.webgazer.addMouseEventListeners === 'function') {
        window.webgazer.addMouseEventListeners();
      }

      // Disable default WebGazer prediction red dot (we render our custom Kalman reticle)
      window.webgazer.showPredictionPoints(false);

      // Enable or disable face and camera preview
      window.webgazer.showVideoPreview(true);
      window.webgazer.showFaceFeedbackBox(showPreview);
      window.webgazer.showFaceOverlay(showPreview);

      window.webgazer.setGazeListener((data: any) => {
        // If user is calibrated and ridge regression produces valid prediction, use it
        if (data && data.x != null && data.y != null && !isNaN(data.x) && !isNaN(data.y) && this.isCalibrated()) {
          if (this.gazeCallback) {
            const normX = typeof window !== 'undefined' && window.innerWidth > 0 ? data.x / window.innerWidth : 0.5;
            const normY = typeof window !== 'undefined' && window.innerHeight > 0 ? data.y / window.innerHeight : 0.5;
            this.gazeCallback(data.x, data.y, normX, normY);
          }
        } else {
          // Direct real-time 3D Iris geometric gaze tracking
          this.dispatchIrisFallback();
        }
      });

      // If WebGazer is already ready/running, resume without duplicating DOM elements
      if (this.isRunning || (window.webgazer.isReady && window.webgazer.isReady())) {
        try {
          await window.webgazer.resume();
        } catch {}
        this.isRunning = true;
        this.startWatchdog();
        if (showPreview) {
          this.styleCameraElements();
        } else {
          this.hideOffscreenContainer();
        }
        return true;
      }

      await window.webgazer.begin();
      this.isRunning = true;
      this.startWatchdog();

      // Style camera preview or position off-screen
      if (showPreview) {
        this.styleCameraElements();
      } else {
        this.hideOffscreenContainer();
      }

      return true;
    } catch (err) {
      console.warn('WebGazer begin notice (checking DOM video stream status):', err);
      const feed = document.getElementById('webgazerVideoFeed') as HTMLVideoElement | null;
      if (feed && (feed.readyState >= 1 || feed.srcObject)) {
        this.isRunning = true;
        this.startWatchdog();
        if (showPreview) {
          this.styleCameraElements();
        } else {
          this.hideOffscreenContainer();
        }
        return true;
      }
      return false;
    }
  }

  /**
   * Hides the raw WebGazer container off-screen while keeping stream processing active at full 30 FPS
   */
  public hideOffscreenContainer(): void {
    if (typeof window === 'undefined') return;
    const apply = () => {
      const container = document.getElementById('webgazerVideoContainer');
      const dot = document.getElementById('webgazerGazeDot');
      if (dot) dot.style.display = 'none';
      if (container) {
        container.style.setProperty('position', 'fixed', 'important');
        container.style.setProperty('top', '-9999px', 'important');
        container.style.setProperty('left', '-9999px', 'important');
        container.style.setProperty('width', '320px', 'important');
        container.style.setProperty('height', '240px', 'important');
        container.style.setProperty('opacity', '0', 'important');
        container.style.setProperty('pointer-events', 'none', 'important');
        container.style.setProperty('z-index', '-1', 'important');
      }
    };
    apply();
    setTimeout(apply, 80);
    setTimeout(apply, 300);
    setTimeout(apply, 800);
  }

  /**
   * Styles WebGazer container and feedback elements into a compact, professional HUD
   */
  public styleCameraElements(): void {
    if (typeof window === 'undefined') return;

    const apply = () => {
      const container = document.getElementById('webgazerVideoContainer');
      const feed = document.getElementById('webgazerVideoFeed') as HTMLVideoElement | null;
      const canvas = document.getElementById('webgazerVideoCanvas') as HTMLCanvasElement | null;
      const box = document.getElementById('webgazerFaceFeedbackBox') as HTMLCanvasElement | null;
      const overlay = document.getElementById('webgazerFaceOverlay') as HTMLCanvasElement | null;
      const dot = document.getElementById('webgazerGazeDot');

      // Hide default red tracking dot (we use our Kalman GazeReticle)
      if (dot) dot.style.display = 'none';

      // Reposition parent container to bottom-right corner
      if (container) {
        container.style.setProperty('position', 'fixed', 'important');
        container.style.setProperty('bottom', '24px', 'important');
        container.style.setProperty('right', '24px', 'important');
        container.style.setProperty('top', 'auto', 'important');
        container.style.setProperty('left', 'auto', 'important');
        container.style.setProperty('width', '190px', 'important');
        container.style.setProperty('height', '142px', 'important');
        container.style.setProperty('z-index', '99990', 'important');
        container.style.setProperty('border-radius', '14px', 'important');
        container.style.setProperty('overflow', 'hidden', 'important');
        container.style.setProperty('border', '2px solid rgba(251, 191, 36, 0.7)', 'important');
        container.style.setProperty('box-shadow', '0 12px 35px rgba(0, 0, 0, 0.85)', 'important');
        container.style.setProperty('background-color', '#000000', 'important');
      }

      if (feed) {
        feed.style.position = 'absolute';
        feed.style.top = '0';
        feed.style.left = '0';
        feed.style.width = '100%';
        feed.style.height = '100%';
        feed.style.objectFit = 'cover';
        feed.style.zIndex = '99991';
      }

      if (canvas) {
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '99992';
      }

      if (overlay) {
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.zIndex = '99993';
      }

      if (box) {
        box.style.position = 'absolute';
        box.style.top = '0';
        box.style.left = '0';
        box.style.width = '100%';
        box.style.height = '100%';
        box.style.zIndex = '99994';
      }
    };

    apply();
    setTimeout(apply, 80);
    setTimeout(apply, 250);
    setTimeout(apply, 600);
    setTimeout(apply, 1200);
  }

  /**
   * Toggles the live camera feedback window on screen
   */
  public setCameraPreviewVisible(visible: boolean): void {
    this.cameraPreviewVisible = visible;
    if (typeof window === 'undefined' || !window.webgazer) return;
    try {
      window.webgazer.showVideoPreview(visible);
      window.webgazer.showFaceFeedbackBox(visible);
      window.webgazer.showFaceOverlay(visible);
      if (visible) {
        this.styleCameraElements();
      }
    } catch {}
  }

  public isCameraPreviewVisible(): boolean {
    return this.cameraPreviewVisible;
  }

  public showCameraPreview(visible: boolean = true): void {
    this.setCameraPreviewVisible(visible);
  }

  /**
   * Records a calibration point at physical coordinate (x, y)
   */
  public recordCalibrationPoint(x: number, y: number, eventType: string = 'click'): void {
    if (this.isLoaded && window.webgazer && typeof window.webgazer.recordScreenPosition === 'function') {
      try {
        window.webgazer.recordScreenPosition(x, y, eventType);
      } catch (err) {
        console.debug('Calibration record error:', err);
      }
    }
  }

  /**
   * Instantly zero/tare the neutral gaze baseline
   */
  public tareGaze(): void {
    irisGazeTracker.tareCenter();
  }

  public isCalibrated(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('focalpoint_calibrated') === 'true';
  }

  public setCalibrated(status: boolean, accuracyPx?: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('focalpoint_calibrated', status ? 'true' : 'false');
    if (accuracyPx != null) {
      localStorage.setItem('focalpoint_accuracy_px', accuracyPx.toFixed(1));
    }
  }

  public getCalibrationAccuracy(): { calibrated: boolean; accuracyPx: number | null } {
    if (typeof window === 'undefined') return { calibrated: false, accuracyPx: null };
    const cal = localStorage.getItem('focalpoint_calibrated') === 'true';
    const acc = localStorage.getItem('focalpoint_accuracy_px');
    return { calibrated: cal, accuracyPx: acc ? parseFloat(acc) : null };
  }

  public clearCalibration(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('focalpoint_calibrated');
    localStorage.removeItem('focalpoint_accuracy_px');
    if (window.webgazer && typeof window.webgazer.clearData === 'function') {
      try {
        window.webgazer.clearData();
      } catch {}
    }
  }

  public pause(): void {
    this.stopWatchdog();
    if (this.isRunning && window.webgazer) {
      try {
        window.webgazer.pause();
      } catch {}
    }
  }

  public resume(): void {
    if (this.isRunning && window.webgazer) {
      try {
        window.webgazer.resume();
      } catch {}
      this.startWatchdog();
    }
  }

  public stop(): void {
    this.stopWatchdog();
    if (this.isRunning && window.webgazer) {
      try {
        window.webgazer.end();
      } catch {}
      this.isRunning = false;
    }
  }

  public isActive(): boolean {
    return this.isRunning;
  }
}

export const webGazerManager = new WebGazerManager();
