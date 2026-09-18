'use client';

import React from 'react';
import { Monitor, Trophy, Cloud, Newspaper, Upload } from 'lucide-react';

export type StreamMode = 'DEMO_CRICKET' | 'DEMO_LECTURE' | 'DEMO_NEWS' | 'SCREEN_CAPTURE' | 'WEBCAM' | 'CUSTOM_UPLOAD';

interface StreamSourceSelectorProps {
  currentMode: StreamMode;
  onSelectMode: (mode: StreamMode, customFile?: File) => void;
  isStreaming: boolean;
}

export const StreamSourceSelector: React.FC<StreamSourceSelectorProps> = ({
  currentMode,
  onSelectMode,
  isStreaming
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSelectMode('CUSTOM_UPLOAD', e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-1 backdrop-blur-md">
      <span className="px-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
        Feed
      </span>

      {/* Demo 1: Cricket */}
      <button
        onClick={() => onSelectMode('DEMO_CRICKET')}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
          currentMode === 'DEMO_CRICKET'
            ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/80 font-semibold'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
        }`}
        aria-pressed={currentMode === 'DEMO_CRICKET'}
        title="Amateur Cricket match broadcast with live scoreboard"
      >
        <Trophy className="h-3.5 w-3.5 text-amber-400/90" />
        <span>Cricket Match</span>
      </button>

      {/* Demo 2: Lecture */}
      <button
        onClick={() => onSelectMode('DEMO_LECTURE')}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
          currentMode === 'DEMO_LECTURE'
            ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/80 font-semibold'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
        }`}
        aria-pressed={currentMode === 'DEMO_LECTURE'}
        title="AWS re:Invent technical lecture presentation"
      >
        <Cloud className="h-3.5 w-3.5 text-sky-400/90" />
        <span>AWS Lecture</span>
      </button>

      {/* Demo 3: News */}
      <button
        onClick={() => onSelectMode('DEMO_NEWS')}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
          currentMode === 'DEMO_NEWS'
            ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/80 font-semibold'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
        }`}
        aria-pressed={currentMode === 'DEMO_NEWS'}
        title="24/7 Global news broadcast with breaking ticker"
      >
        <Newspaper className="h-3.5 w-3.5 text-emerald-400/90" />
        <span>News Ticker</span>
      </button>

      <span className="h-4 w-px bg-zinc-800 mx-0.5" />

      {/* Live Screen Share */}
      <button
        onClick={() => onSelectMode('SCREEN_CAPTURE')}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
          currentMode === 'SCREEN_CAPTURE'
            ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40 font-semibold'
            : 'text-zinc-400 hover:text-sky-300 hover:bg-zinc-800/40'
        }`}
        title="Share any browser tab or window playing live video to test in real-time"
        aria-pressed={currentMode === 'SCREEN_CAPTURE'}
      >
        <Monitor className="h-3.5 w-3.5" />
        <span>Screen Share</span>
      </button>

      {/* Upload File */}
      <label
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
          currentMode === 'CUSTOM_UPLOAD'
            ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/80 font-semibold'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
        }`}
        title="Upload your own MP4 video to inspect"
      >
        <Upload className="h-3.5 w-3.5" />
        <span>Upload MP4</span>
        <input
          type="file"
          accept="video/mp4,video/webm"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

