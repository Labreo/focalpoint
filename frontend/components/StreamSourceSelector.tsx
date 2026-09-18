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
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-bg-3 bg-bg-1 p-1 font-telemetry">
      <span className="px-2 text-xs font-bold text-muted uppercase tracking-wider">
        // FEED:
      </span>

      {/* Demo 1: Cricket */}
      <button
        onClick={() => onSelectMode('DEMO_CRICKET')}
        className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold transition ${
          currentMode === 'DEMO_CRICKET'
            ? 'bg-amber-highlight text-bg shadow-sm font-black'
            : 'text-fg hover:bg-bg-2 hover:underline'
        }`}
        aria-pressed={currentMode === 'DEMO_CRICKET'}
      >
        <Trophy className="h-3 w-3" />
        <span>Cricket</span>
      </button>

      {/* Demo 2: Lecture */}
      <button
        onClick={() => onSelectMode('DEMO_LECTURE')}
        className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold transition ${
          currentMode === 'DEMO_LECTURE'
            ? 'bg-amber-highlight text-bg shadow-sm font-black'
            : 'text-fg hover:bg-bg-2 hover:underline'
        }`}
        aria-pressed={currentMode === 'DEMO_LECTURE'}
      >
        <BookOpen className="h-3 w-3" />
        <span>Lecture</span>
      </button>

      {/* Demo 3: News */}
      <button
        onClick={() => onSelectMode('DEMO_NEWS')}
        className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold transition ${
          currentMode === 'DEMO_NEWS'
            ? 'bg-amber-highlight text-bg shadow-sm font-black'
            : 'text-fg hover:bg-bg-2 hover:underline'
        }`}
        aria-pressed={currentMode === 'DEMO_NEWS'}
      >
        <Newspaper className="h-3 w-3" />
        <span>News</span>
      </button>

      <span className="text-bg-3">\\</span>

      {/* Live Screen Share (YouTube / Video / TV) */}
      <button
        onClick={() => onSelectMode('SCREEN_CAPTURE')}
        className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold transition ${
          currentMode === 'SCREEN_CAPTURE'
            ? 'bg-cyan-highlight text-bg shadow-sm font-black'
            : 'text-cyan-highlight hover:bg-bg-2 hover:underline'
        }`}
        title="Share any Chrome tab playing a real YouTube video or remote stream"
        aria-pressed={currentMode === 'SCREEN_CAPTURE'}
      >
        <Monitor className="h-3 w-3" />
        <span>Screen Share (YouTube)</span>
      </button>

      {/* Webcam */}
      <button
        onClick={() => onSelectMode('WEBCAM')}
        className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold transition ${
          currentMode === 'WEBCAM'
            ? 'bg-cyan-highlight text-bg shadow-sm font-black'
            : 'text-fg hover:bg-bg-2 hover:underline'
        }`}
        aria-pressed={currentMode === 'WEBCAM'}
      >
        <Camera className="h-3 w-3" />
        <span>Webcam</span>
      </button>
    </div>
  );
};
