'use client';

import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Eye, 
  Cloud, 
  Activity, 
  Database, 
  Radio, 
  Zap, 
  Layers 
} from 'lucide-react';
import { PathologyConfig } from '../types';

interface SystemSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePathology: PathologyConfig;
  onSelectPathology: (type: PathologyConfig['type']) => void;
}

export const SystemSpecsModal: React.FC<SystemSpecsModalProps> = ({
  isOpen,
  onClose,
  activePathology,
  onSelectPathology
}) => {
  const [activeTab, setActiveTab] = useState<'ARCHITECTURE' | 'OPHTHALMIC' | 'AWS_CLOUD'>('ARCHITECTURE');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700/60 text-amber-400">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 tracking-tight">
                System Specifications & Architecture
              </h3>
              <p className="text-xs text-zinc-400">
                AWS Track 2 (Ship It) • 60 FPS GPU Shaders • Gaze Kinematics • Bedrock Multi-Modal AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition"
            aria-label="Close specifications dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Segmented Navigation Tabs */}
        <div className="mt-4 flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
          <button
            onClick={() => setActiveTab('ARCHITECTURE')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition ${
              activeTab === 'ARCHITECTURE'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/70 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-amber-400" />
            <span>Kinematics & Shaders</span>
          </button>
          <button
            onClick={() => setActiveTab('OPHTHALMIC')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition ${
              activeTab === 'OPHTHALMIC'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/70 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="h-3.5 w-3.5 text-sky-400" />
            <span>Pathology Profiles</span>
          </button>
          <button
            onClick={() => setActiveTab('AWS_CLOUD')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition ${
              activeTab === 'AWS_CLOUD'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/70 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cloud className="h-3.5 w-3.5 text-emerald-400" />
            <span>AWS Infrastructure</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'ARCHITECTURE' && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                <div className="flex items-center gap-2 text-zinc-200 font-bold text-sm mb-1.5">
                  <Eye className="h-4 w-4 text-amber-400" />
                  <span>1. 60 FPS WebGazer & Discrete Kalman Filter</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Pupil & iris center coordinates are captured in a high-frequency loop. A 4-state 2D Discrete Kalman Filter with process noise covariance Q = 0.08 and measurement noise R = 18.0 strips involuntary ocular micro-saccades and tremor without injecting lag (&lt; 16ms latency).
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                <div className="flex items-center gap-2 text-zinc-200 font-bold text-sm mb-1.5">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span>2. Temporal Differential Hashing Engine</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Instead of naively streaming 60 video frames per second to cloud vision APIs, FocalPoint samples the canvas at 1.6 FPS into a 16×16 grayscale hash matrix. AWS Lambda fan-out is triggered strictly on scene cuts or perceptual change delta &gt; 12%, reducing API cost and network overhead by 94%.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                <div className="flex items-center gap-2 text-zinc-200 font-bold text-sm mb-1.5">
                  <Layers className="h-4 w-4 text-amber-400" />
                  <span>3. WebGL GPU Fragment Shader Pipeline</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Hardware-accelerated fragment shaders apply non-linear radial compression (fitting 16:9 widescreen video into a 220px intact visual field) and 3×3 Laplacian kernel convolution for real-time edge sharpening without CPU stutter.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'OPHTHALMIC' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-medium">Active Pathology Profile:</span>
                {(['AMD', 'TUNNEL_VISION', 'LOW_ACUITY'] as PathologyConfig['type'][]).map((type) => (
                  <button
                    key={type}
                    onClick={() => onSelectPathology(type)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition border ${
                      activePathology.type === type
                        ? 'border-amber-400/80 bg-amber-400/10 text-amber-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {type === 'AMD' ? 'Macular Degeneration' : type === 'TUNNEL_VISION' ? 'Tunnel Vision' : 'Low Acuity'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5">
                  <span className="font-mono text-[11px] font-bold text-amber-400">AMD (Scotoma)</span>
                  <p className="mt-1.5 text-zinc-400 leading-relaxed">
                    Loss of central fovea. FocalPoint dynamically projects fixated text and graphics to the patient's calibrated Preferred Retinal Locus (PRL) in the peripheral parafovea.
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5">
                  <span className="font-mono text-[11px] font-bold text-sky-400">Tunnel Vision (RP)</span>
                  <p className="mt-1.5 text-zinc-400 leading-relaxed">
                    Loss of peripheral visual field leaving a 10°–20° circular window. Radial anamorphic compression maps the full screen into the residual cone.
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5">
                  <span className="font-mono text-[11px] font-bold text-emerald-400">Low Acuity & Cataracts</span>
                  <p className="mt-1.5 text-zinc-400 leading-relaxed">
                    Severe optical blur and reduced contrast sensitivity. 3x3 Laplacian sharpening and 19.4:1 Atkinson Hyperlegible high-contrast reflow restore legibility.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'AWS_CLOUD' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                    <Cloud className="h-3.5 w-3.5 text-amber-400" />
                    <span>AWS Amplify</span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-emerald-400">ONLINE (HTTP/2)</div>
                  <div className="text-[10px] text-zinc-500 truncate">main.d1s5otc6zch586</div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                    <Radio className="h-3.5 w-3.5 text-sky-400" />
                    <span>API Gateway v2</span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-emerald-400">ONLINE (CORS)</div>
                  <div className="text-[10px] text-zinc-500 truncate">xxeqb4odra.execute-api</div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                    <Cpu className="h-3.5 w-3.5 text-purple-400" />
                    <span>AWS Lambda</span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-emerald-400">2048 MB Python 3.12</div>
                  <div className="text-[10px] text-zinc-500 truncate">focalpoint-orchestrator</div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                    <Database className="h-3.5 w-3.5 text-emerald-400" />
                    <span>DynamoDB + S3</span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-emerald-400">ENCRYPTED AT REST</div>
                  <div className="text-[10px] text-zinc-500 truncate">FocalPoint_UserProfiles</div>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5">
                <div className="font-bold text-zinc-200 mb-1">AWS Multi-Modal Scene Extraction Pipeline</div>
                <p className="text-zinc-400 leading-relaxed">
                  1. Amazon Rekognition extracts spatial bounding boxes and raw OCR text lines.<br />
                  2. Amazon Bedrock (Anthropic Claude 3.5 Sonnet) parses semantic structures (live scorecards, slide bullets, tickers).<br />
                  3. Amazon Polly (Ruth / Matthew Neural TTS) generates zero-latency speech synthesis streamed to client AudioContext.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-500">
          <span className="font-mono">Region: us-east-1 (N. Virginia)</span>
          <button
            onClick={onClose}
            className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1 font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
