'use client';

import React from 'react';
import { SemanticRegion } from '../types';
import { PinOff, Move, Activity } from 'lucide-react';
import { audioHaptics } from '../lib/synthetic_audio';

interface PersistentHUDOverlayProps {
  pinnedRegions: SemanticRegion[];
  onUnpin: (regionId: string) => void;
  scale?: number;
}

export const PersistentHUDOverlay: React.FC<PersistentHUDOverlayProps> = ({
  pinnedRegions,
  onUnpin,
  scale = 1.0
}) => {
  if (pinnedRegions.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 p-4">
      {pinnedRegions.map((region) => {
        const strategy = region.adaptationStrategy as any;
        const anchor = strategy?.anchorCorner || 'BOTTOM_RIGHT';

        // Position classes according to anchor corner
        let positionClass = 'bottom-6 right-6';
        if (anchor === 'TOP_LEFT') positionClass = 'top-20 left-6';
        if (anchor === 'TOP_RIGHT') positionClass = 'top-20 right-6';
        if (anchor === 'BOTTOM_LEFT') positionClass = 'bottom-6 left-6';

        const metrics = region.extractedMetrics || {};
        const metricEntries = Object.entries(metrics);

        return (
          <div
            key={region.id}
            className={`pointer-events-auto absolute ${positionClass} max-w-md rounded-2xl border-2 border-emerald-400 bg-slate-950/95 p-5 shadow-2xl backdrop-blur-xl transition-all duration-300`}
            style={{
              transform: `scale(${scale})`,
              boxShadow: '0 10px 30px rgba(74, 222, 128, 0.25)'
            }}
            role="region"
            aria-label={`Pinned HUD: ${region.textContent || 'Scoreboard'}`}
          >
            {/* Header */}
            <div className="mb-3 flex items-center justify-between border-b border-emerald-500/30 pb-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Activity className="h-4 w-4 animate-pulse" />
                <span className="font-atkinson text-xs font-black uppercase tracking-wider">
                  PINNED PERIPHERAL HUD • {anchor.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => {
                  audioHaptics.playDismissPop();
                  onUnpin(region.id);
                }}
                className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs text-slate-300 transition hover:bg-red-500 hover:text-white"
                title="Unpin widget from periphery"
                aria-label="Unpin HUD"
              >
                <PinOff className="h-3.5 w-3.5" />
                <span>Unpin</span>
              </button>
            </div>

            {/* Main Label */}
            <div className="font-atkinson text-lg font-black text-amber-highlight">
              {region.textContent || 'Telemetry Widget'}
            </div>

            {/* Extracted Metrics Grid */}
            {metricEntries.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-2 font-telemetry">
                {metricEntries.map(([key, val]) => (
                  <div key={key} className="rounded-lg bg-white/5 p-2 text-left">
                    <div className="text-[10px] font-bold uppercase text-slate-400">{key}</div>
                    <div className="text-base font-extrabold text-cyan-highlight">{val}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
