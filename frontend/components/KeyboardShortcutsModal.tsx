'use client';

import React from 'react';
import { X, Keyboard, ShieldAlert } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Numpad 1 – 9', desc: 'Directs gaze coordinate immediately to matching 3x3 screen sector (e.g. 7 = Top-Left, 2 = Bottom Chyron)' },
    { key: 'Spacebar', desc: 'Freeze / Pause media frame for relaxed inspection without motion' },
    { key: 'C', desc: 'Cycle high-contrast ophthalmic color preset (Obsidian Amber, Carbon Cyan, Mint, Polar Inversion)' },
    { key: 'P', desc: 'Cycle pathology profile (AMD -> Retinitis Pigmentosa -> Low Acuity -> Hemianopia)' },
    { key: 'S', desc: 'Toggle Caregiver & Evaluator Pathology Simulator overlay' },
    { key: 'T', desc: 'Trigger Speech Synthesis (Read Aloud) on active fixated text block' },
    { key: '+ / -', desc: 'Step Atkinson Hyperlegible typography scale up or down (+0.25x)' },
    { key: 'Esc', desc: 'Dismiss active reflow drawer, modal, or pinned HUD widget' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-amber-highlight bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-amber-highlight">
            <Keyboard className="h-5 w-5" />
            <h3 className="font-atkinson text-lg font-black uppercase tracking-wider">
              Universal Keyboard Accessibility Matrix
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
            aria-label="Close shortcuts guide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl bg-white/5 p-3 font-atkinson transition hover:bg-white/10"
            >
              <kbd className="rounded-lg border border-white/20 bg-slate-900 px-3 py-1 font-telemetry text-sm font-black text-cyan-highlight shadow-inner">
                {sc.key}
              </kbd>
              <span className="max-w-md text-right text-xs font-semibold leading-relaxed text-slate-300">
                {sc.desc}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-xl bg-amber-400/10 p-3 text-xs text-amber-highlight">
          <ShieldAlert className="h-4 w-4 flex-shrink-0" />
          <span>
            Designed to guarantee 100% testability and full independence for users with severe motor or ocular nystagmus impairments.
          </span>
        </div>
      </div>
    </div>
  );
};
