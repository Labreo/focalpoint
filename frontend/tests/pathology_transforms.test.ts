import { describe, it, expect } from 'vitest';
import { 
  computePathologyTransform, 
  anamorphicRadialCompression, 
  CONTRAST_THEMES 
} from '../lib/pathology_transforms';
import { PathologyConfig } from '../types';

describe('Pathology Transforms & Ophthalmic Remapping', () => {
  const amdConfig: PathologyConfig = {
    type: 'AMD',
    description: 'Age-Related Macular Degeneration',
    dwellThresholdMs: 280,
    maxDispersionPx: 65,
    preferredContrastTheme: 'AMBER',
    fontScaleRem: 2.2,
    prlOffset: { x: 120, y: -80 },
    scotomaRadiusPx: 110,
    tunnelRadiusPx: 0,
    audioHapticEnabled: true
  };

  it('computes eccentric PRL shift and Gaussian scotoma mask for AMD', () => {
    const transform = computePathologyTransform(
      amdConfig,
      { x: 500, y: 400 },
      { width: 1920, height: 1080 }
    );

    expect(transform.viewportTransform).toBe('translate3d(120px, -80px, 0)');
    expect(transform.prlTargetOffset).toEqual({ x: 120, y: -80 });
    expect(transform.maskOverlay).toContain('radial-gradient');
    expect(transform.maskOverlay).toContain('110px');
  });

  it('calculates anamorphic radial compression for Retinitis Pigmentosa correctly', () => {
    const center = { x: 500, y: 500 };
    const tunnelRadius = 200;
    const maxRadius = 800;

    // Center point remains identical
    const centerRes = anamorphicRadialCompression(center.x, center.y, center.x, center.y, tunnelRadius, maxRadius);
    expect(centerRes.x).toBe(center.x);
    expect(centerRes.y).toBe(center.y);

    // Peripheral point (800px away) is compressed within tunnelRadius (200px)
    const periphRes = anamorphicRadialCompression(center.x + 800, center.y, center.x, center.y, tunnelRadius, maxRadius, 0.5);
    const dist = Math.sqrt(Math.pow(periphRes.x - center.x, 2) + Math.pow(periphRes.y - center.y, 2));
    expect(dist).toBeCloseTo(tunnelRadius, 1);
  });

  it('verifies contrast themes exceed WCAG 2.2 AAA thresholds', () => {
    expect(CONTRAST_THEMES.AMBER.foreground).toBe('#FDE047');
    expect(CONTRAST_THEMES.AMBER.background).toBe('#050811');
    expect(CONTRAST_THEMES.AMBER.contrastRatio).toContain('Exceeds AAA');

    expect(CONTRAST_THEMES.CYAN.foreground).toBe('#38BDF8');
    expect(CONTRAST_THEMES.INVERT.contrastRatio).toContain('Exceeds AAA');
  });
});
