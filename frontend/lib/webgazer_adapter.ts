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

import { irisGazeTracker } from './iris_gaze_tracker';

export type GazeCallback = (x: number, y: number) => void;

class WebGazerManager {
  private isLoaded: boolean = false;
  private isRunning: boolean = false;
  private gazeCallback: GazeCallback | null = null;
  private cameraPreviewVisible: boolean = true;

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
   * Initializes WebGazer tracker and binds the continuous gaze listener
   */
  private watchdogTimer: any = null;

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
            this.gazeCallback(iris.screenX, iris.screenY);
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

      // 1. Check if WebGazer has a valid prediction
      try {
        const pred = window.webgazer.getCurrentPrediction ? window.webgazer.getCurrentPrediction() : null;
        if (pred && pred.x != null && pred.y != null && !isNaN(pred.x) && !isNaN(pred.y)) {
          if (this.gazeCallback) {
            this.gazeCallback(pred.x, pred.y);
          }
          return;
        }
      } catch {}

      // 2. Fall back to Direct Iris Geometric Landmark Tracker
      this.dispatchIrisFallback();
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
      window.webgazer.showVideoPreview(showPreview);
      window.webgazer.showFaceFeedbackBox(showPreview);
      window.webgazer.showFaceOverlay(showPreview);

      // Seed baseline anchor points so RidgeReg never returns null on startup
      if (typeof window.webgazer.recordScreenPosition === 'function') {
        const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
        const h = typeof window !== 'undefined' ? window.innerHeight : 720;
        window.webgazer.recordScreenPosition(w * 0.5, h * 0.5, 'click');
        window.webgazer.recordScreenPosition(w * 0.25, h * 0.25, 'click');
        window.webgazer.recordScreenPosition(w * 0.75, h * 0.25, 'click');
        window.webgazer.recordScreenPosition(w * 0.25, h * 0.75, 'click');
        window.webgazer.recordScreenPosition(w * 0.75, h * 0.75, 'click');
      }

      window.webgazer.setGazeListener((data: any) => {
        if (data && data.x != null && data.y != null && !isNaN(data.x) && !isNaN(data.y)) {
          if (this.gazeCallback) {
            this.gazeCallback(data.x, data.y);
          }
        } else {
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
        }
        return true;
      }

      await window.webgazer.begin();
      this.isRunning = true;
      this.startWatchdog();

      // Style camera preview to dock cleanly in bottom-right corner
      if (showPreview) {
        this.styleCameraElements();
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
        }
        return true;
      }
      return false;
    }
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
