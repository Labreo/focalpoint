/**
 * 1-Euro Filter for Low-Latency, Jitter-Free Interactive Eye-Tracking
 * Reference: Casiez, G., Roussel, N. and Vogel, D. (2012). 
 * "1 € Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Human-Computer Interfaces". CHI 2012.
 */

class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  public filter(value: number, alpha: number): number {
    if (this.y === null) {
      this.s = value;
      this.y = value;
      return value;
    }
    this.y = alpha * value + (1.0 - alpha) * this.s!;
    this.s = this.y;
    return this.y;
  }

  public lastValue(): number | null {
    return this.y;
  }

  public reset(): void {
    this.y = null;
    this.s = null;
  }
}

export class OneEuroFilter1D {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xFilter: LowPassFilter;
  private dxFilter: LowPassFilter;
  private lastTime: number | null = null;

  /**
   * @param minCutoff Minimum cutoff frequency in Hz (lower = more smoothing when stationary)
   * @param beta Speed coefficient (higher = less lag during fast movements)
   * @param dCutoff Cutoff frequency for derivative filtering in Hz
   */
  constructor(minCutoff: number = 0.8, beta: number = 0.015, dCutoff: number = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
  }

  private alpha(rate: number, cutoff: number): number {
    const tau = 1.0 / (2.0 * Math.PI * cutoff);
    const te = 1.0 / rate;
    return 1.0 / (1.0 + tau / te);
  }

  public filter(value: number, timestampMs: number): number {
    if (this.lastTime === null) {
      this.lastTime = timestampMs;
      return this.xFilter.filter(value, 1.0);
    }

    const dt = Math.max(0.001, (timestampMs - this.lastTime) / 1000.0);
    this.lastTime = timestampMs;
    const rate = 1.0 / dt;

    // Estimate derivative
    const prevX = this.xFilter.lastValue();
    const dx = prevX !== null ? (value - prevX) * rate : 0.0;
    const edx = this.dxFilter.filter(dx, this.alpha(rate, this.dCutoff));

    // Compute dynamic cutoff frequency
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.xFilter.filter(value, this.alpha(rate, cutoff));
  }

  public reset(): void {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }
}

export class OneEuroFilter2D {
  private filterX: OneEuroFilter1D;
  private filterY: OneEuroFilter1D;

  constructor(minCutoff: number = 0.8, beta: number = 0.015, dCutoff: number = 1.0) {
    this.filterX = new OneEuroFilter1D(minCutoff, beta, dCutoff);
    this.filterY = new OneEuroFilter1D(minCutoff, beta, dCutoff);
  }

  public filter(x: number, y: number, timestampMs: number): { x: number; y: number } {
    return {
      x: this.filterX.filter(x, timestampMs),
      y: this.filterY.filter(y, timestampMs)
    };
  }

  public reset(): void {
    this.filterX.reset();
    this.filterY.reset();
  }
}
