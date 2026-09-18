'use client';

import React from 'react';
import { PathologyType } from '../types';
import { EyeOff, AlertTriangle, Sparkles } from 'lucide-react';

interface PathologySimulatorProps {
  isEnabled: boolean;
  pathologyType: PathologyType;
  gazePoint: { x: number; y: number };
  scotomaRadiusPx?: number;
  tunnelRadiusPx?: number;
  onToggle: (enabled: boolean) => void;
}

export const PathologySimulator: React.FC<PathologySimulatorProps> = ({
  isEnabled,
  pathologyType,
  gazePoint,
  scotomaRadiusPx = 110,
  tunnelRadiusPx = 200,
  onToggle
}) => {
  if (!isEnabled) {
    return (
      <div className="fixed bottom-6 left-6 z-20">
        <button
          onClick={() => onToggle(true)}
          className="flex items-center gap-2 rounded-xl border border-amber-300/40 bg-slate-950/80 px-4 py-2.5 font-atkinson text-xs font-bold text-amber-highlight shadow-lg backdrop-blur-md transition hover:bg-amber-400 hover:text-slate-950"
          title="Experience the user's visual impairment (Hotkey: S)"
          aria-label="Enable Caregiver Pathology Simulator"
        >
          <EyeOff className="h-4 w-4" />
          <span>Caregiver Simulator: OFF</span>
        </button>
      </div>
    );
  }

  // Generate the optical deficit mask following user gaze
  let maskStyle: React.CSSProperties = {};
  let pathologyLabel = '';
  let pathologyExplanation = '';

  switch (pathologyType) {
    case 'AMD':
      maskStyle = {
        background: `radial-gradient(circle ${scotomaRadiusPx}px at ${gazePoint.x}px ${gazePoint.y}px, rgba(5, 8, 17, 0.96) 0%, rgba(5, 8, 17, 0.88) 60%, rgba(5, 8, 17, 0.3) 85%, transparent 100%)`
      };
      pathologyLabel = 'Age-Related Macular Degeneration (AMD)';
      pathologyExplanation = 'Central Scotoma (~15° field loss). Foveal vision is blacked out. Traditional zoom simply enlarges letters inside the blind spot; FocalPoint reflows text into the functioning peripheral PRL.';
      break;

    case 'TUNNEL_VISION':
      maskStyle = {
        background: `radial-gradient(circle ${tunnelRadiusPx}px at ${gazePoint.x}px ${gazePoint.y}px, transparent 0%, transparent 65%, rgba(5, 8, 17, 0.90) 85%, rgba(5, 8, 17, 0.98) 100%)`
      };
      pathologyLabel = 'Retinitis Pigmentosa (Tunnel Vision)';
      pathologyExplanation = 'Severe peripheral visual loss (<20° visual angle). Everything outside the gaze circle is invisible. FocalPoint radially compresses peripheral HUDs into the visible sweet spot.';
      break;

    case 'LOW_ACUITY':
      maskStyle = {
        backdropFilter: 'blur(7px) contrast(0.65)',
        backgroundColor: 'rgba(5, 8, 17, 0.25)'
      };
      pathologyLabel = 'Diabetic Retinopathy & Severe Cataracts';
      pathologyExplanation = 'Extreme contrast sensitivity loss and diffuse blur. Standard media glyphs become illegible blobs. FocalPoint applies Atkinson Hyperlegible glyphs with 19:1 contrast.';
      break;

    case 'HEMIANOPIA':
      maskStyle = {
        background: `linear-gradient(to right, transparent 0%, transparent 50%, rgba(5, 8, 17, 0.96) 65%, rgba(5, 8, 17, 0.99) 100%)`
      };
      pathologyLabel = 'Homonymous Hemianopia (Half-Field Deficit)';
      pathologyExplanation = 'Complete visual loss across the right hemifield following stroke or neurological trauma. FocalPoint shifts media content toward the left functional field.';
      break;
  }

  return (
    <>
      {/* Visual Field Deficit Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-20 transition-all duration-75"
        style={maskStyle}
        aria-hidden="true"
      />

      {/* Caregiver Diagnostic Card (Bottom Left) */}
      <div className="fixed bottom-6 left-6 z-30 max-w-sm rounded-2xl border border-amber-highlight bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2 text-amber-highlight">
            <AlertTriangle className="h-4 w-4 animate-bounce" />
            <span className="font-atkinson text-xs font-black uppercase tracking-wider">
              Diagnostic Simulator: ACTIVE
            </span>
          </div>
          <button
            onClick={() => onToggle(false)}
            className="rounded bg-white/10 px-2 py-0.5 text-xs text-white hover:bg-white/20"
            aria-label="Disable Simulator"
          >
            Turn OFF
          </button>
        </div>

        <div className="mt-2">
          <h4 className="font-atkinson text-sm font-bold text-white">{pathologyLabel}</h4>
          <p className="mt-1 font-atkinson text-xs leading-relaxed text-slate-300">
            {pathologyExplanation}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-400/10 p-2 text-[11px] font-bold text-amber-highlight">
          <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
          <span>FocalPoint automatically adapts media around this deficit!</span>
        </div>
      </div>
    </>
  );
};
