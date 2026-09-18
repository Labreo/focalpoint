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
  public async start(onGaze: GazeCallback, showPreview: boolean = true): Promise<boolean> {
    this.gazeCallback = onGaze;
    this.cameraPreviewVisible = showPreview;
    const loaded = await this.loadScript();
    if (!loaded || !window.webgazer) return false;

    try {
      // Configure ridge regression model and persistence
      window.webgazer.setRegression('ridge');
      window.webgazer.saveDataAcrossSessions(true);

      // Disable default WebGazer prediction red dot (we render our Kalman reticle)
      window.webgazer.showPredictionPoints(false);

      // Enable or disable face and camera preview
      window.webgazer.showVideoPreview(showPreview);
      window.webgazer.showFaceFeedbackBox(showPreview);
      window.webgazer.showFaceOverlay(showPreview);

      window.webgazer.setGazeListener((data: any, elapsedTime: number) => {
        if (data && data.x != null && data.y != null) {
          if (this.gazeCallback) {
            this.gazeCallback(data.x, data.y);
          }
        }
      });

      await window.webgazer.begin();
      this.isRunning = true;

      // Style camera preview to dock cleanly in bottom-right corner
      if (showPreview) {
        this.styleCameraElements();
      }

      return true;
    } catch (err) {
      console.warn('WebGazer initialization error (camera access or permissions):', err);
      return false;
    }
  }

  /**
   * Styles WebGazer video and face feedback box into a compact, professional HUD
   */
  public styleCameraElements(): void {
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      const feed = document.getElementById('webgazerVideoFeed');
      const canvas = document.getElementById('webgazerVideoCanvas');
      const box = document.getElementById('webgazerFaceFeedbackBox');

      const applyCornerStyle = (el: HTMLElement | null, zIndex: number, hasBorder: boolean = false) => {
        if (!el) return;
        el.style.position = 'fixed';
        el.style.bottom = '20px';
        el.style.right = '20px';
        el.style.top = 'auto';
        el.style.left = 'auto';
        el.style.width = '180px';
        el.style.height = '135px';
        el.style.borderRadius = '10px';
        el.style.zIndex = `${zIndex}`;
        if (hasBorder) {
          el.style.border = '2px solid #38bdf8';
          el.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.8)';
        }
      };

      applyCornerStyle(feed, 99990, true);
      applyCornerStyle(canvas, 99991);
      applyCornerStyle(box, 99992);
    }, 500);
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
    }
  }

  public stop(): void {
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
