import { describe, it, expect, beforeEach } from 'vitest';
import { GazeKalmanFilter2D } from '../lib/kalman_filter';

describe('GazeKalmanFilter2D', () => {
  let filter: GazeKalmanFilter2D;

  beforeEach(() => {
    filter = new GazeKalmanFilter2D(0.08, 18.0);
  });

  it('initializes on the first measurement', () => {
    const result = filter.update(500, 300, 1000);
    expect(result.x).toBe(500);
    expect(result.y).toBe(300);
    expect(result.vx).toBe(0);
    expect(result.vy).toBe(0);
  });

  it('smooths high-frequency noise while tracking position', () => {
    // Initial point
    filter.update(500, 300, 1000);

    // Feed noisy measurements oscillating around (500, 300)
    let smoothed;
    smoothed = filter.update(520, 310, 1016);
    smoothed = filter.update(485, 290, 1032);
    smoothed = filter.update(510, 305, 1048);

    // Smoothed coordinates should be close to 500, 300 without wild jumps
    expect(smoothed.x).toBeGreaterThan(490);
    expect(smoothed.x).toBeLessThan(515);
    expect(smoothed.y).toBeGreaterThan(290);
    expect(smoothed.y).toBeLessThan(310);
  });

  it('estimates non-zero velocity during movement', () => {
    filter.update(100, 100, 1000);
    filter.update(200, 100, 1050);
    const result = filter.update(300, 100, 1100);

    // Should have positive vx and speed
    expect(result.vx).toBeGreaterThan(0);
    expect(result.speed).toBeGreaterThan(0);
  });

  it('resets correctly', () => {
    filter.update(100, 100, 1000);
    filter.reset(0, 0);
    const coords = filter.getCoordinates();
    expect(coords.x).toBe(0);
    expect(coords.y).toBe(0);
  });
});
