import { describe, it, expect } from 'vitest';
import { TemporalTrackingEngine } from '../lib/temporal_tracker';
import { SemanticRegion, BoundingBoxKeyframe } from '../types';

describe('TemporalTrackingEngine', () => {
  it('correctly interpolates bounding box positions between keyframes', () => {
    const keyframes: BoundingBoxKeyframe[] = [
      { time: 2.0, box: { left: 0.10, top: 0.20, width: 0.30, height: 0.40 } },
      { time: 6.0, box: { left: 0.50, top: 0.40, width: 0.30, height: 0.40 } }
    ];

    // Midpoint at t = 4.0s (u = 0.5)
    const midBox = TemporalTrackingEngine.interpolateBox(keyframes, 4.0);
    expect(midBox.left).toBeCloseTo(0.30, 2);
    expect(midBox.top).toBeCloseTo(0.30, 2);
    expect(midBox.width).toBeCloseTo(0.30, 2);

    // Boundary checks
    const beforeBox = TemporalTrackingEngine.interpolateBox(keyframes, 1.0);
    expect(beforeBox.left).toBe(0.10);

    const afterBox = TemporalTrackingEngine.interpolateBox(keyframes, 8.0);
    expect(afterBox.left).toBe(0.50);
  });

  it('filters active regions by temporal window and swaps time-specific text', () => {
    const mockRegions: SemanticRegion[] = [
      {
        id: 'bowler_track',
        type: 'ACTION_ZONE',
        confidence: 0.99,
        boundingBox: { left: 0.2, top: 0.2, width: 0.3, height: 0.4 },
        startTime: 0.0,
        endTime: 6.0,
        timeContent: [
          {
            startTime: 0.0,
            endTime: 3.0,
            label: 'Bowler Run-Up',
            textContent: 'Bowler approaching wicket'
          },
          {
            startTime: 3.1,
            endTime: 6.0,
            label: 'Delivery Stride',
            textContent: 'Release at 140 km/h'
          }
        ],
        adaptationStrategy: { action: 'FOVEATED_OPTICAL_ZOOM' }
      },
      {
        id: 'replay_hud',
        type: 'PERSISTENT_HUD',
        confidence: 0.98,
        boundingBox: { left: 0.0, top: 0.8, width: 1.0, height: 0.2 },
        startTime: 7.0,
        endTime: 15.0,
        adaptationStrategy: { action: 'PIN_TO_PERIPHERY' }
      }
    ];

    // At t = 1.5s: bowler_track should be active with "Bowler Run-Up"
    const at1s = TemporalTrackingEngine.getActiveRegionsAtTime(mockRegions, 1.5);
    expect(at1s.length).toBe(1);
    expect(at1s[0].id).toBe('bowler_track');
    expect(at1s[0].label).toBe('Bowler Run-Up');

    // At t = 4.0s: bowler_track should be active with "Delivery Stride"
    const at4s = TemporalTrackingEngine.getActiveRegionsAtTime(mockRegions, 4.0);
    expect(at4s.length).toBe(1);
    expect(at4s[0].label).toBe('Delivery Stride');

    // At t = 10.0s: replay_hud should be active, bowler_track inactive
    const at10s = TemporalTrackingEngine.getActiveRegionsAtTime(mockRegions, 10.0);
    expect(at10s.length).toBe(1);
    expect(at10s[0].id).toBe('replay_hud');
  });
});
