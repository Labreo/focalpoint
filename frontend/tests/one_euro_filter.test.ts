import { describe, it, expect } from 'vitest';
import { OneEuroFilter2D } from '../lib/one_euro_filter';

describe('OneEuroFilter2D', () => {
  it('suppresses high-frequency sensor noise when signal is stationary', () => {
    const filter = new OneEuroFilter2D(0.8, 0.015);
    const baseX = 500;
    const baseY = 300;
    const noisySamples: { x: number; y: number }[] = [];

    // Simulate 30 stationary frames with +/- 10px random noise at 33ms interval (30 FPS)
    let t = 1000;
    for (let i = 0; i < 30; i++) {
      const noiseX = (Math.sin(i * 1.7) * 10);
      const noiseY = (Math.cos(i * 2.3) * 10);
      const filtered = filter.filter(baseX + noiseX, baseY + noiseY, t);
      noisySamples.push(filtered);
      t += 33.3;
    }

    // The standard deviation of the last 15 filtered samples should be much lower than the raw noise std dev (~7px)
    const recent = noisySamples.slice(15);
    const avgX = recent.reduce((sum, p) => sum + p.x, 0) / recent.length;
    const varianceX = recent.reduce((sum, p) => sum + Math.pow(p.x - avgX, 2), 0) / recent.length;
    const stdDevX = Math.sqrt(varianceX);

    expect(stdDevX).toBeLessThan(3.5);
    expect(Math.abs(avgX - baseX)).toBeLessThan(5.0);
  });

  it('adapts cutoff frequency during fast saccades to minimize lag', () => {
    const filter = new OneEuroFilter2D(0.8, 0.02);
    let t = 1000;

    // Stationary start
    for (let i = 0; i < 10; i++) {
      filter.filter(100, 100, t);
      t += 33.3;
    }

    // Fast saccade jump across screen: from 100 to 800 over 100ms (3 frames)
    filter.filter(350, 100, t);
    t += 33.3;
    filter.filter(600, 100, t);
    t += 33.3;
    const saccadeEnd = filter.filter(800, 100, t);

    // Filter should quickly follow the saccade without excessive lag
    expect(saccadeEnd.x).toBeGreaterThan(700);
  });
});
