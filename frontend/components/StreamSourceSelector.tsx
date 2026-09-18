'use client';

import React from 'react';
import { Monitor, Camera, Trophy, BookOpen, Newspaper, Upload } from 'lucide-react';

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
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/80 p-1">
      <span className="px-2 font-mono text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        Video Feed:
      </span>

      {/* Demo 1: Cricket */}
      <button
        onClick={() => onSelectMode('DEMO_CRICKET')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
          currentMode === 'DEMO_CRICKET'
            ? 'bg-amber-400 text-black shadow-sm'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
        aria-pressed={currentMode === 'DEMO_CRICKET'}
      >
        <Trophy className="h-3.5 w-3.5" />
        <span>Cricket Match (Scoreboard)</span>
      </button>

      {/* Demo 2: Lecture */}
      <button
        onClick={() => onSelectMode('DEMO_LECTURE')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
          currentMode === 'DEMO_LECTURE'
            ? 'bg-amber-400 text-black shadow-sm'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
        aria-pressed={currentMode === 'DEMO_LECTURE'}
      >
        <BookOpen className="h-3.5 w-3.5" />
        <span>Tech Lecture (Slides)</span>
      </button>

      {/* Demo 3: News */}
      <button
        onClick={() => onSelectMode('DEMO_NEWS')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
          currentMode === 'DEMO_NEWS'
            ? 'bg-amber-400 text-black shadow-sm'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
        aria-pressed={currentMode === 'DEMO_NEWS'}
      >
        <Newspaper className="h-3.5 w-3.5" />
        <span>Breaking News (Chyron)</span>
      </button>

      <span className="text-slate-700">|</span>

      {/* Live Screen Share (YouTube / Video / TV) */}
      <button
        onClick={() => onSelectMode('SCREEN_CAPTURE')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
          currentMode === 'SCREEN_CAPTURE'
            ? 'bg-cyan-400 text-black shadow-sm'
            : 'text-cyan-400 hover:bg-slate-800'
        }`}
        title="Share any Chrome tab playing a real YouTube video or remote stream"
        aria-pressed={currentMode === 'SCREEN_CAPTURE'}
      >
        <Monitor className="h-3.5 w-3.5" />
        <span>Screen Share (YouTube)</span>
      </button>

      {/* Upload File */}
      <label
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
          currentMode === 'CUSTOM_UPLOAD'
            ? 'bg-emerald-400 text-black shadow-sm'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
        title="Upload your own MP4 video to test"
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
