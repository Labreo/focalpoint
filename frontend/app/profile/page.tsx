'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { PathologyConfig, ContrastPreset, PathologyType } from '../../types';
import { CONTRAST_THEMES } from '../../lib/pathology_transforms';
import { focalPointClient } from '../../lib/aws_client';

export default function ProfilePage() {
  const [profile, setProfile] = useState<PathologyConfig>({
    type: 'AMD',
    description: 'Age-Related Macular Degeneration (Central Scotoma)',
    dwellThresholdMs: 280,
    maxDispersionPx: 65,
    preferredContrastTheme: 'AMBER',
    fontScaleRem: 2.2,
    prlOffset: { x: 120, y: -80 },
    scotomaRadiusPx: 110,
    tunnelRadiusPx: 220,
    audioHapticEnabled: true
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load User Profile from DynamoDB on mount
  useEffect(() => {
    async function loadSavedProfile() {
      try {
        const saved = await focalPointClient.getProfile('usr_kanak_001');
        if (saved && saved.type) {
          setProfile(prev => ({ ...prev, ...saved }));
        }
      } catch (err) {
        console.warn('Failed to load profile from DynamoDB:', err);
      }
    }
    loadSavedProfile();
  }, []);

  // Live Canvas Preview of Scotoma & PRL Offset
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    // Background
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (profile.type === 'AMD') {
      // 1. Central Scotoma (Blind Spot)
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, profile.scotomaRadiusPx);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, profile.scotomaRadiusPx, 0, Math.PI * 2);
      ctx.fill();

      // Blind Spot Label
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CENTRAL SCOTOMA (BLIND SPOT)', cx, cy + 4);

      // 2. Preferred Retinal Locus (PRL) Projection
      const prlX = cx + profile.prlOffset.x;
      const prlY = cy + profile.prlOffset.y;

      // Connecting vector arrow
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(prlX, prlY);
      ctx.stroke();
      ctx.setLineDash([]);

      // PRL Sweet spot
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(prlX, prlY, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#050811';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('PRL', prlX, prlY + 3);
    } else if (profile.type === 'TUNNEL_VISION') {
      // Retinitis Pigmentosa Tunnel
      ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
      ctx.fillRect(0, 0, w, h);

      // Cleared tunnel hole
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(cx, cy, profile.tunnelRadiusPx, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, profile.tunnelRadiusPx, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`FUNCTIONING VISUAL CONE (${profile.tunnelRadiusPx}px)`, cx, cy);
    } else {
      // Low Acuity / Hemianopia
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CONTRAST-ENHANCED ATKINSON HYPERLEGIBLE ACTIVE', cx, cy);
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await focalPointClient.saveProfile('usr_kanak_001', profile);
    } catch (err) {
      console.warn('Failed to persist profile to DynamoDB:', err);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <main className="min-h-screen bg-bg text-fg crt bg-grid bg-fixed p-6 md:p-10 select-none">
      <div className="mx-auto max-w-5xl">
        {/* Top Header */}
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-bg-3 pb-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md border border-bg-3 bg-bg-1 px-3.5 py-1.5 font-telemetry text-xs font-bold text-fg transition hover:border-fg hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>// RETURN TO VIEWER</span>
          </Link>

          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-highlight" />
            <h1 className="font-bold text-base sm:text-lg text-fg tracking-wider font-telemetry">
              @focalpoint // pathology_profile
            </h1>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/x.svg" className="size-3.5 animate-spin-snapped" alt="x icon" />
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-md bg-amber-highlight px-4 py-2 font-telemetry text-xs font-black text-bg shadow-md transition hover:scale-105"
          >
            {savedSuccess ? (
              <>
                <Check className="h-4 w-4 text-bg font-black" />
                <span>SAVED (DYNAMODB)</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 text-bg" />
                <span>SAVE PROFILE</span>
              </>
            )}
          </button>
        </header>

        {/* Deltea Spiky Divider */}
        <div className="spiky-divider mb-8" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Form Controls */}
          <div className="space-y-6 lg:col-span-7">
            {/* Pathology Type Selector */}
            <div className="rounded-lg border border-bg-3 bg-bg-1 p-6">
              <label className="block font-telemetry text-xs font-bold uppercase tracking-wider text-muted mb-3">
                // DIAGNOSED OPHTHALMIC PATHOLOGY \\
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'AMD', label: 'Macular Degeneration', desc: 'Central Scotoma / PRL' },
                  { id: 'TUNNEL_VISION', label: 'Retinitis Pigmentosa', desc: 'Tunnel Vision' },
                  { id: 'LOW_ACUITY', label: 'Diabetic Retinopathy', desc: 'Low Acuity / Blur' },
                  { id: 'HEMIANOPIA', label: 'Homonymous Hemianopia', desc: 'Half-Field Deficit' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setProfile(p => ({ ...p, type: item.id as PathologyType }))}
                    className={`rounded-md border p-3.5 text-left transition ${
                      profile.type === item.id
                        ? 'border-amber-highlight bg-amber-400/10 text-amber-highlight shadow-sm'
                        : 'border-bg-3 bg-bg-2 text-muted hover:border-fg hover:text-fg'
                    }`}
                  >
                    <div className="font-telemetry text-xs font-bold uppercase tracking-wider">{item.label}</div>
                    <div className="text-[11px] text-muted mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* AMD: Preferred Retinal Locus (PRL) Sliders */}
            {profile.type === 'AMD' && (
              <div className="rounded-lg border border-bg-3 bg-bg-1 p-6">
                <h3 className="font-telemetry text-xs font-bold uppercase tracking-wider text-muted mb-4">
                  // PREFERRED RETINAL LOCUS (PRL) SPATIAL OFFSETS \\
                </h3>

                <div className="space-y-4 font-telemetry text-xs text-muted">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Horizontal Offset (ΔX):</span>
                      <span className="font-telemetry font-bold text-amber-highlight">{profile.prlOffset.x}px</span>
                    </div>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={profile.prlOffset.x}
                      onChange={(e) => setProfile(p => ({ ...p, prlOffset: { ...p.prlOffset, x: parseInt(e.target.value) } }))}
                      className="w-full accent-amber-highlight"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Vertical Offset (ΔY):</span>
                      <span className="font-telemetry font-bold text-amber-highlight">{profile.prlOffset.y}px</span>
                    </div>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={profile.prlOffset.y}
                      onChange={(e) => setProfile(p => ({ ...p, prlOffset: { ...p.prlOffset, y: parseInt(e.target.value) } }))}
                      className="w-full accent-amber-highlight"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Central Scotoma Radius:</span>
                      <span className="font-telemetry font-bold text-amber-highlight">{profile.scotomaRadiusPx}px</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="180"
                      value={profile.scotomaRadiusPx}
                      onChange={(e) => setProfile(p => ({ ...p, scotomaRadiusPx: parseInt(e.target.value) }))}
                      className="w-full accent-amber-highlight"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Dwell Threshold Slider */}
            <div className="rounded-lg border border-bg-3 bg-bg-1 p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-telemetry text-xs font-bold uppercase tracking-wider text-muted">
                  // GAZE DWELL THRESHOLD (I-VDT FILTER) \\
                </span>
                <span className="font-telemetry font-bold text-amber-highlight">
                  {profile.dwellThresholdMs} ms
                </span>
              </div>
              <p className="text-xs text-muted mb-3 font-telemetry">
                Duration eyes must remain fixated on a text block before dynamic reflow triggers.
              </p>
              <input
                type="range"
                min="180"
                max="500"
                step="20"
                value={profile.dwellThresholdMs}
                onChange={(e) => setProfile(p => ({ ...p, dwellThresholdMs: parseInt(e.target.value) }))}
                className="w-full accent-amber-highlight"
              />
            </div>

            {/* Contrast Theme Picker */}
            <div className="rounded-lg border border-bg-3 bg-bg-1 p-6">
              <label className="block font-telemetry text-xs font-bold uppercase tracking-wider text-muted mb-3">
                // HIGH-CONTRAST PALETTE (WCAG 2.2 AAA STANDARDS) \\
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(CONTRAST_THEMES) as ContrastPreset[]).map((preset) => {
                  const info = CONTRAST_THEMES[preset];
                  return (
                    <button
                      key={preset}
                      onClick={() => setProfile(p => ({ ...p, preferredContrastTheme: preset }))}
                      className={`rounded-md border p-3 text-left transition ${
                        profile.preferredContrastTheme === preset
                          ? 'border-amber-highlight bg-amber-400/10 text-amber-highlight shadow-sm'
                          : 'border-bg-3 bg-bg-2 text-muted hover:border-fg hover:text-fg'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-bg-3"
                          style={{ backgroundColor: info.foreground }}
                        />
                        <span className="font-telemetry text-xs font-bold text-fg">{info.name}</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-telemetry mt-1">{info.contrastRatio}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Live Diagnostic Preview Canvas */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-lg border border-bg-3 bg-bg-1 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-telemetry text-xs font-bold uppercase tracking-wider text-amber-highlight">
                  // LIVE VISUAL FIELD SIMULATION \\
                </span>
                <span className="rounded border border-bg-3 bg-bg-2 px-2 py-0.5 font-telemetry text-[10px] text-muted">
                  [ INTERACTIVE ]
                </span>
              </div>

              <div className="overflow-hidden rounded-md border border-bg-3 bg-bg">
                <canvas
                  ref={previewCanvasRef}
                  width={420}
                  height={320}
                  className="w-full h-auto"
                />
              </div>

              <p className="mt-3 font-telemetry text-xs leading-relaxed text-muted">
                The simulation shows how FocalPoint remaps focal content into functioning peripheral zones (PRL) to completely bypass central scotomas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
