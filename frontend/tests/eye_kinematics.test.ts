import { describe, it, expect, beforeEach } from 'vitest';
import { KinematicIntentClassifier } from '../lib/eye_kinematics';
import { SemanticRegion } from '../types';

describe('KinematicIntentClassifier (I-VDT)', () => {
  let classifier: KinematicIntentClassifier;

  const mockRegions: SemanticRegion[] = [
    {
      id: 'reg_headline',
      type: 'TEXT_BLOCK',
      confidence: 0.99,
      boundingBox: { left: 0.1, top: 0.8, width: 0.8, height: 0.15 },
      textContent: 'Breaking News: Historic Accord',
      adaptationStrategy: { action: 'DYNAMIC_REFLOW' }
    }
  ];

  beforeEach(() => {
    // 280ms dwell threshold, 65px max dispersion, 220ms sliding window
    classifier = new KinematicIntentClassifier(280, 65, 220);
  });

  it('classifies stationary gaze as FIXATION and accumulates dwell on intersecting region', () => {
    // Viewport: 1000 x 1000
    // Region bounding box in px: x: 100-900, y: 800-950
    // Gaze at (500, 850) -> inside region

    let res = classifier.processPoint({ x: 500, y: 850 }, mockRegions, 1000, 1000, 1000);
    res = classifier.processPoint({ x: 502, y: 849 }, mockRegions, 1000, 1000, 1050);
    res = classifier.processPoint({ x: 499, y: 851 }, mockRegions, 1000, 1000, 1100);

    expect(res.state).toBe('FIXATION');
    expect(res.dispersionPx).toBeLessThanOrEqual(65);
    expect(res.dwellProgress).toBeGreaterThan(0);

    // Advance time past 280ms dwell
    res = classifier.processPoint({ x: 501, y: 850 }, mockRegions, 1000, 1000, 1350);
    expect(res.state).toBe('FIXATION');
    expect(res.dwellProgress).toBe(1.0);
    expect(res.activeRegion?.id).toBe('reg_headline');
  });

  it('classifies rapid eye jumps as SACCADE and resets dwell accumulator', () => {
    // Start with fixation
    classifier.processPoint({ x: 500, y: 850 }, mockRegions, 1000, 1000, 1000);
    classifier.processPoint({ x: 502, y: 849 }, mockRegions, 1000, 1000, 1050);
    let res = classifier.processPoint({ x: 501, y: 851 }, mockRegions, 1000, 1000, 1100);
    expect(res.dwellProgress).toBeGreaterThan(0);

    // Rapid saccade to other side of screen (x: 100, y: 100) within 16ms
    res = classifier.processPoint({ x: 100, y: 100 }, mockRegions, 1000, 1000, 1116);
    expect(res.state).toBe('SACCADE');
    expect(res.activeRegion).toBeNull();
    expect(res.dwellProgress).toBe(0);
  });
});
