/**
 * 2D Discrete Kalman Filter for Webcam Gaze Stabilization
 * 
 * Filters raw noisy gaze measurements (WebGazer variance ~80-140px)
 * into smooth, continuous coordinates without introducing perceived latency.
 * 
 * State Vector: [x, y, vx, vy]^T
 */

import { FilteredGaze } from '../types';

export class GazeKalmanFilter2D {
  // State vector: [x, y, vx, vy]
  private x: number = 0;
  private y: number = 0;
  private vx: number = 0;
  private vy: number = 0;

  // Covariance matrix P (4x4 flattened: p00, p01, ..., p33)
  private P: number[] = [
    100, 0, 0, 0,
    0, 100, 0, 0,
    0, 0, 10, 0,
    0, 0, 0, 10
  ];

  // Process noise Q diagonal
  private qPos: number = 0.08;
  private qVel: number = 0.5;

  // Measurement noise R
  private rBase: number = 18.0;

  private isInitialized: boolean = false;
  private lastTimestamp: number = 0;

  constructor(processNoise = 0.08, measurementNoise = 18.0) {
    this.qPos = processNoise;
    this.rBase = measurementNoise;
  }

  public reset(initialX = 0, initialY = 0): void {
    this.x = initialX;
    this.y = initialY;
    this.vx = 0;
    this.vy = 0;
    this.P = [
      100, 0, 0, 0,
      0, 100, 0, 0,
      0, 0, 10, 0,
      0, 0, 0, 10
    ];
    this.isInitialized = false;
    this.lastTimestamp = 0;
  }

  /**
   * Update the filter with a new raw measurement (zX, zY)
   * @param zX Raw measured X coordinate
   * @param zY Raw measured Y coordinate
   * @param timestamp Current timestamp (ms), default performance.now()
   */
  public update(zX: number, zY: number, timestamp?: number): FilteredGaze {
    const now = timestamp ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());

    if (!this.isInitialized) {
      this.x = zX;
      this.y = zY;
      this.vx = 0;
      this.vy = 0;
      this.lastTimestamp = now;
      this.isInitialized = true;
      return { x: this.x, y: this.y, vx: 0, vy: 0, speed: 0 };
    }

    // Delta time in seconds, clamped between 1ms and 100ms
    let dt = (now - this.lastTimestamp) / 1000.0;
    if (dt <= 0.001) dt = 0.016; // default ~60Hz
    if (dt > 0.1) dt = 0.1;
    this.lastTimestamp = now;

    // 1. Predict Step
    // x_pred = x + vx * dt
    // y_pred = y + vy * dt
    const xPred = this.x + this.vx * dt;
    const yPred = this.y + this.vy * dt;
    const vxPred = this.vx;
    const vyPred = this.vy;

    // Predict covariance: P_pred = F * P * F^T + Q
    // Simplified algebraic formulation for 4x4 state
    const p00 = this.P[0] + dt * (this.P[8] + this.P[2] + dt * this.P[10]) + this.qPos;
    const p02 = this.P[2] + dt * this.P[10];
    const p11 = this.P[5] + dt * (this.P[13] + this.P[7] + dt * this.P[15]) + this.qPos;
    const p13 = this.P[7] + dt * this.P[15];
    const p22 = this.P[10] + this.qVel;
    const p33 = this.P[15] + this.qVel;

    // 2. Adaptive Measurement Noise:
    // If innovation is huge (saccade), increase R slightly to prevent overshoot, but lower R for faster catch-up
    const innovX = zX - xPred;
    const innovY = zY - yPred;
    const distanceSq = innovX * innovX + innovY * innovY;
    
    // Dynamically adjust R for fast eye jumps
    const rCurrent = distanceSq > 4000 ? this.rBase * 0.4 : this.rBase;

    // 3. Update Step (Kalman Gain K = P * H^T * (H * P * H^T + R)^-1)
    const sX = p00 + rCurrent;
    const sY = p11 + rCurrent;

    const kX0 = p00 / sX;
    const kX2 = p02 / sX;

    const kY1 = p11 / sY;
    const kY3 = p13 / sY;

    // State Correction
    this.x = xPred + kX0 * innovX;
    this.vx = vxPred + kX2 * innovX;

    this.y = yPred + kY1 * innovY;
    this.vy = vyPred + kY3 * innovY;

    // Covariance Update: P = (I - K * H) * P_pred
    this.P[0] = (1 - kX0) * p00;
    this.P[2] = (1 - kX0) * p02;
    this.P[8] = -kX2 * p00 + p02;
    this.P[10] = -kX2 * p02 + p22;

    this.P[5] = (1 - kY1) * p11;
    this.P[7] = (1 - kY1) * p13;
    this.P[13] = -kY3 * p11 + p13;
    this.P[15] = -kY3 * p13 + p33;

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

    return {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      speed
    };
  }

  public getCoordinates(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }
}
