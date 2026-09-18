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

  /**
   * Dynamically injects WebGazer.js from official CDN if not present in window
   */
  public async loadScript(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (window.webgazer) {
      this.isLoaded = true;
      return true;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://webgazer.cs.brown.edu/webgazer.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.isLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        console.warn('WebGazer.js script failed to load from CDN. Using synthetic/mouse gaze fallback.');
        this.isLoaded = false;
        resolve(false);
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
  public async start(onGaze: GazeCallback): Promise<boolean> {
    this.gazeCallback = onGaze;
    const loaded = await this.loadScript();
    if (!loaded || !window.webgazer) return false;

    try {
      // Configure ridge regression model
      window.webgazer.setRegression('ridge');
      window.webgazer.saveDataAcrossSessions(true);

      // Disable default WebGazer prediction dot & video box overlay to maintain our custom high-contrast reticle
      window.webgazer.showVideoPreview(false);
      window.webgazer.showPredictionPoints(false);

      window.webgazer.setGazeListener((data: any, elapsedTime: number) => {
        if (data && data.x != null && data.y != null) {
          if (this.gazeCallback) {
            this.gazeCallback(data.x, data.y);
          }
        }
      });

      await window.webgazer.begin();
      this.isRunning = true;
      return true;
    } catch (err) {
      console.warn('WebGazer initialization error (camera access or permissions):', err);
      return false;
    }
  }

  /**
   * Records a calibration point at physical coordinate (x, y)
   */
  public recordCalibrationPoint(x: number, y: number): void {
    if (this.isLoaded && window.webgazer && typeof window.webgazer.recordScreenPosition === 'function') {
      try {
        window.webgazer.recordScreenPosition(x, y, 'click');
      } catch (err) {
        console.debug('Calibration record error:', err);
      }
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
