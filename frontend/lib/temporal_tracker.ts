/**
 * Real-Time Temporal Keyframe Tracking Engine for Video Broadcasts
 * 
 * Dynamically computes interpolated bounding boxes and timestamp-synchronized
 * semantic content as the video timeline progresses. Handles moving subjects
 * (athletes, actors, presenter walkouts), slide flips, and broadcast lower-thirds.
 */

import { SemanticRegion, BoundingBox, BoundingBoxKeyframe, TimeSpecificContent } from '../types';

export class TemporalTrackingEngine {
  /**
   * Linearly interpolates a BoundingBox between keyframes at timestamp t.
   */
  public static interpolateBox(keyframes: BoundingBoxKeyframe[], time: number): BoundingBox {
    if (!keyframes || keyframes.length === 0) {
      return { left: 0, top: 0, width: 0, height: 0 };
    }
    if (keyframes.length === 1 || time <= keyframes[0].time) {
      return { ...keyframes[0].box };
    }
    if (time >= keyframes[keyframes.length - 1].time) {
      return { ...keyframes[keyframes.length - 1].box };
    }

    // Locate enclosing keyframe interval [k0, k1]
    let k0 = keyframes[0];
    let k1 = keyframes[1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
        k0 = keyframes[i];
        k1 = keyframes[i + 1];
        break;
      }
    }

    const dt = k1.time - k0.time;
    if (dt <= 0.0001) {
      return { ...k1.box };
    }

    const u = Math.max(0, Math.min(1, (time - k0.time) / dt));

    return {
      left: Number((k0.box.left + u * (k1.box.left - k0.box.left)).toFixed(4)),
      top: Number((k0.box.top + u * (k1.box.top - k0.box.top)).toFixed(4)),
      width: Number((k0.box.width + u * (k1.box.width - k0.box.width)).toFixed(4)),
      height: Number((k0.box.height + u * (k1.box.height - k0.box.height)).toFixed(4))
    };
  }

  /**
   * Resolves and interpolates the active semantic regions for a given video playback timestamp.
   */
  public static getActiveRegionsAtTime(
    allRegions: SemanticRegion[],
    currentTimeSec: number
  ): SemanticRegion[] {
    if (!allRegions) return [];

    const activeList: SemanticRegion[] = [];

    for (const region of allRegions) {
      // 1. Check temporal window validity
      const start = region.startTime ?? 0.0;
      const end = region.endTime ?? Infinity;

      if (currentTimeSec < start || currentTimeSec > end) {
        continue;
      }

      // 2. Interpolate bounding box if keyframes are defined
      let activeBox = region.boundingBox;
      if (region.keyframes && region.keyframes.length > 0) {
        activeBox = this.interpolateBox(region.keyframes, currentTimeSec);
      }

      // 3. Resolve time-specific labels, descriptions, and metrics
      let activeLabel = region.label;
      let activeText = region.textContent;
      let activeMetrics = region.extractedMetrics;

      if (region.timeContent && region.timeContent.length > 0) {
        const matchingSlice = region.timeContent.find(
          tc => currentTimeSec >= tc.startTime && currentTimeSec <= tc.endTime
        );
        if (matchingSlice) {
          if (matchingSlice.label) activeLabel = matchingSlice.label;
          if (matchingSlice.textContent) activeText = matchingSlice.textContent;
          if (matchingSlice.extractedMetrics) activeMetrics = matchingSlice.extractedMetrics;
        }
      }

      activeList.push({
        ...region,
        boundingBox: activeBox,
        label: activeLabel,
        textContent: activeText,
        extractedMetrics: activeMetrics
      });
    }

    return activeList;
  }
}
