'use client';

import React from 'react';
import { Tv, Monitor, Camera, Trophy, BookOpen, Newspaper } from 'lucide-react';
import { DEMO_SCENES } from '../lib/demo_scenes';

export type StreamMode = 'DEMO_CRICKET' | 'DEMO_LECTURE' | 'DEMO_NEWS' | 'SCREEN_CAPTURE' | 'WEBCAM';

interface StreamSourceSelectorProps {
  currentMode: StreamMode;
  onSelectMode: (mode: StreamMode) => void;
  isStreaming: boolean;
}

export const StreamSourceSelector: React.FC<StreamSourceSelectorProps> = ({
  currentMode,
  onSelectMode,
  isStreaming
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-1.5 backdrop-blur-md">
      <span className="px-2 font-atkinson text-xs font-bold uppercase tracking-wider text-slate-400">
        Media Stream:
      </span>

      {/* Demo 1: Cricket */}
      <button
        onClick={() => onSelectMode('DEMO_CRICKET')}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-atkinson text-xs font-bold transition ${
          currentMode === 'DEMO_CRICKET'
            ? 'bg-amber-highlight text-slate-950 shadow-md shadow-amber-300/30'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`}
        aria-pressed={currentMode === 'DEMO_CRICKET'}
      >
        <Trophy className="h-3.5 w-3.5" />
        <span>Cricket Match</span>
      </button>

      {/* Demo 2: Lecture */}
      <button
        onClick={() => onSelectMode('DEMO_LECTURE')}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-atkinson text-xs font-bold transition ${
          currentMode === 'DEMO_LECTURE'
            ? 'bg-amber-highlight text-slate-950 shadow-md shadow-amber-300/30'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`}
        aria-pressed={currentMode === 'DEMO_LECTURE'}
      >
        <BookOpen className="h-3.5 w-3.5" />
        <span>Medical Lecture</span>
      </button>

      {/* Demo 3: News */}
      <button
        onClick={() => onSelectMode('DEMO_NEWS')}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-atkinson text-xs font-bold transition ${
          currentMode === 'DEMO_NEWS'
            ? 'bg-amber-highlight text-slate-950 shadow-md shadow-amber-300/30'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`}
        aria-pressed={currentMode === 'DEMO_NEWS'}
      >
        <Newspaper className="h-3.5 w-3.5" />
        <span>Breaking News</span>
      </button>

      <div className="h-4 w-px bg-white/20" />

      {/* Live Screen Share */}
      <button
        onClick={() => onSelectMode('SCREEN_CAPTURE')}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-atkinson text-xs font-bold transition ${
          currentMode === 'SCREEN_CAPTURE'
            ? 'bg-cyan-highlight text-slate-950 shadow-md shadow-cyan-300/30'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`}
        aria-pressed={currentMode === 'SCREEN_CAPTURE'}
      >
        <Monitor className="h-3.5 w-3.5" />
        <span>Screen Share</span>
      </button>

      {/* Webcam */}
      <button
        onClick={() => onSelectMode('WEBCAM')}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-atkinson text-xs font-bold transition ${
          currentMode === 'WEBCAM'
            ? 'bg-cyan-highlight text-slate-950 shadow-md shadow-cyan-300/30'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`}
        aria-pressed={currentMode === 'WEBCAM'}
      >
        <Camera className="h-3.5 w-3.5" />
        <span>Webcam Feed</span>
      </button>
    </div>
  );
};
