/**
 * Interactive Demo Broadcast Scenes
 * 
 * Provides 3 rich, production-grade interactive broadcast environments
 * designed to demonstrate FocalPoint's semantic decomposition capabilities:
 * 1. Live International Cricket Broadcast (Scores, stats, batsman portrait, ticker)
 * 2. Academic Medical Lecture (Slide hierarchy, complex terminology, presenter inset)
 * 3. 24/7 Global News Broadcast (Breaking banner, lower-third ticker, anchor portrait)
 */

import { DemoScene, SemanticRegion } from '../types';

export const DEMO_SCENES: DemoScene[] = [
  // Scene 1: Cricket Broadcast
  {
    id: 'cricket-match',
    title: 'Live Sports: Cricket World Championship',
    category: 'Sports Broadcast',
    description: 'High-speed sports broadcast featuring complex numerical scoreboards, player portraits, and dynamic running commentary.',
    aspectRatio: '16:9',
    regions: [
      {
        id: 'cricket_scoreboard_hud',
        type: 'PERSISTENT_HUD',
        confidence: 0.98,
        boundingBox: { left: 0.04, top: 0.04, width: 0.38, height: 0.14 },
        textContent: 'IND 287/4  (42.3 ov) • TARGET 324 • CRR 6.75',
        extractedMetrics: {
          team: 'IND',
          score: '287/4',
          overs: '42.3',
          target: '324',
          crr: '6.75',
          rrr: '4.93'
        },
        adaptationStrategy: {
          action: 'PIN_TO_PERIPHERY',
          anchorCorner: 'BOTTOM_RIGHT',
          scaleFactor: 1.75
        }
      },
      {
        id: 'cricket_batter_face',
        type: 'FACIAL_PORTRAIT',
        confidence: 0.99,
        boundingBox: { left: 0.62, top: 0.16, width: 0.28, height: 0.52 },
        textContent: 'Batsman: V. Kohli (Focused & Calling Run)',
        attributes: {
          mouthOpen: true,
          dominantEmotion: 'DETERMINED'
        },
        adaptationStrategy: {
          action: 'SUPER_RESOLVE_AND_STABILIZE',
          contrastBoost: 1.45,
          edgeSharpen: true
        }
      },
      {
        id: 'cricket_partnership_text',
        type: 'TEXT_BLOCK',
        confidence: 0.96,
        boundingBox: { left: 0.04, top: 0.76, width: 0.54, height: 0.08 },
        textContent: 'Partnership: 94 runs (78 balls) • V. Kohli 104* (112) • KL Rahul 48 (52)',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.2,
            fontWeight: '800',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'cricket_chyron_ticker',
        type: 'TEXT_BLOCK',
        confidence: 0.97,
        boundingBox: { left: 0.04, top: 0.86, width: 0.92, height: 0.10 },
        textContent: 'MILESTONE ALERT: Virat Kohli completes 51st ODI century with an imperious pull shot to deep mid-wicket.',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.4,
            fontWeight: '800',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      }
    ],
    canvasRender: (ctx, w, h, t) => {
      // Stadium background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0a1d37');
      bgGrad.addColorStop(0.5, '#1e3a5f');
      bgGrad.addColorStop(0.85, '#19543e');
      bgGrad.addColorStop(1, '#0e3829');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Floodlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.beginPath();
      ctx.arc(w * 0.15, h * 0.1, 140, 0, Math.PI * 2);
      ctx.arc(w * 0.85, h * 0.1, 140, 0, Math.PI * 2);
      ctx.fill();

      // Pitch oval
      ctx.fillStyle = '#1c6b4b';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.65, w * 0.42, h * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Batsman Silhouette / Portrait box (Right side)
      const faceBox = { x: w * 0.62, y: h * 0.16, bw: w * 0.28, bh: h * 0.52 };
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(faceBox.x, faceBox.y, faceBox.bw, faceBox.bh);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(faceBox.x, faceBox.y, faceBox.bw, faceBox.bh);

      // Stylized player face
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(faceBox.x + faceBox.bw * 0.5, faceBox.y + faceBox.bh * 0.38, faceBox.bw * 0.26, 0, Math.PI * 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();

      // Helmet & Visor
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.arc(faceBox.x + faceBox.bw * 0.5, faceBox.y + faceBox.bh * 0.35, faceBox.bw * 0.28, Math.PI, 0);
      ctx.fill();

      // Jersey
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(faceBox.x + faceBox.bw * 0.15, faceBox.y + faceBox.bh * 0.65, faceBox.bw * 0.7, faceBox.bh * 0.35);

      // Scoreboard Card (Top Left)
      const sbX = w * 0.04, sbY = h * 0.04, sbW = w * 0.38, sbH = h * 0.14;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
      ctx.fillRect(sbX, sbY, sbW, sbH);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sbX, sbY, sbW, sbH);

      ctx.fillStyle = '#fde047';
      ctx.font = `bold ${Math.round(sbH * 0.38)}px monospace`;
      ctx.fillText('IND 287/4  (42.3 ov)', sbX + 16, sbY + sbH * 0.45);

      ctx.fillStyle = '#94a3b8';
      ctx.font = `${Math.round(sbH * 0.24)}px monospace`;
      ctx.fillText('TARGET: 324  |  CRR: 6.75  |  RRR: 4.93', sbX + 16, sbY + sbH * 0.82);

      // Partnership Graphic (Bottom Left)
      const ptX = w * 0.04, ptY = h * 0.76, ptW = w * 0.54, ptH = h * 0.08;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(ptX, ptY, ptW, ptH);
      ctx.fillStyle = '#38bdf8';
      ctx.font = `bold ${Math.round(ptH * 0.42)}px sans-serif`;
      ctx.fillText('Partnership: 94 (78b) • Kohli 104* (112) • Rahul 48 (52)', ptX + 14, ptY + ptH * 0.65);

      // Lower Third News/Milestone Ticker
      const tkX = w * 0.04, tkY = h * 0.86, tkW = w * 0.92, tkH = h * 0.10;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(tkX, tkY, tkW, tkH);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(tkX, tkY, tkW * 0.18, tkH);

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(tkH * 0.40)}px sans-serif`;
      ctx.fillText('MILESTONE', tkX + 16, tkY + tkH * 0.64);

      ctx.fillStyle = '#fde047';
      ctx.font = `${Math.round(tkH * 0.34)}px sans-serif`;
      const scrollOffset = (t * 40) % (tkW * 0.6);
      ctx.fillText('Virat Kohli completes 51st ODI century with an imperious pull to deep mid-wicket.', tkX + tkW * 0.20 - (scrollOffset * 0.1), tkY + tkH * 0.64);
    }
  },

  // Scene 2: Academic Medical Lecture
  {
    id: 'medical-lecture',
    title: 'Academic Lecture: Ophthalmic Neural Prosthetics',
    category: 'Academic Lecture',
    description: 'Detailed university presentation slide featuring complex anatomical diagrams, multi-line typography, and remote speaker camera feed.',
    aspectRatio: '16:9',
    regions: [
      {
        id: 'lecture_title_text',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        boundingBox: { left: 0.05, top: 0.05, width: 0.88, height: 0.12 },
        textContent: 'NEUROLOGICAL MECHANISMS OF PREFERRED RETINAL LOCUS ADAPTATION',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.6,
            fontWeight: '800',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'lecture_speaker_face',
        type: 'FACIAL_PORTRAIT',
        confidence: 0.98,
        boundingBox: { left: 0.68, top: 0.20, width: 0.26, height: 0.36 },
        textContent: 'Lecturer: Prof. K. Waradkar (Explaining Ocular Saccades)',
        attributes: { mouthOpen: true, dominantEmotion: 'THOUGHTFUL' },
        adaptationStrategy: {
          action: 'SUPER_RESOLVE_AND_STABILIZE',
          contrastBoost: 1.40,
          edgeSharpen: true
        }
      },
      {
        id: 'lecture_bullet_1',
        type: 'TEXT_BLOCK',
        confidence: 0.97,
        boundingBox: { left: 0.05, top: 0.22, width: 0.58, height: 0.16 },
        textContent: '1. Central Scotoma induces irreversible loss of high-density foveal cone photoreceptors.',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.1,
            fontWeight: '700',
            highContrastTheme: 'MINT_ON_NAVY'
          }
        }
      },
      {
        id: 'lecture_bullet_2',
        type: 'TEXT_BLOCK',
        confidence: 0.96,
        boundingBox: { left: 0.05, top: 0.42, width: 0.58, height: 0.18 },
        textContent: '2. Preferred Retinal Locus (PRL) develops spontaneously in parafoveal retina, shifting the visual axis.',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.1,
            fontWeight: '700',
            highContrastTheme: 'MINT_ON_NAVY'
          }
        }
      },
      {
        id: 'lecture_bullet_3',
        type: 'TEXT_BLOCK',
        confidence: 0.95,
        boundingBox: { left: 0.05, top: 0.64, width: 0.88, height: 0.22 },
        textContent: '3. Clinical Takeaway: Traditional magnification fails because it enlarges content inside the blind spot; semantic eccentric projection restores reading autonomy.',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.2,
            fontWeight: '800',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      }
    ],
    canvasRender: (ctx, w, h, t) => {
      // Clean academic slide background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Top title bar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(w * 0.04, h * 0.04, w * 0.92, h * 0.13);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w * 0.04, h * 0.04, w * 0.92, h * 0.13);

      ctx.fillStyle = '#38bdf8';
      ctx.font = `bold ${Math.round(h * 0.045)}px sans-serif`;
      ctx.fillText('NEUROLOGICAL MECHANISMS OF PREFERRED RETINAL LOCUS', w * 0.07, h * 0.12);

      // Bullet Points
      ctx.font = `${Math.round(h * 0.032)}px sans-serif`;
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('1. Central Scotoma induces irreversible loss of high-density foveal cones.', w * 0.07, h * 0.30);
      ctx.fillText('2. Preferred Retinal Locus (PRL) develops spontaneously in parafoveal retina.', w * 0.07, h * 0.50);
      ctx.fillStyle = '#fde047';
      ctx.fillText('3. Clinical Takeaway: Traditional zoom enlarges content inside the blind spot;', w * 0.07, h * 0.72);
      ctx.fillText('   semantic eccentric projection restores genuine visual autonomy.', w * 0.07, h * 0.78);

      // Speaker Camera Inset (Right)
      const spX = w * 0.68, spY = h * 0.20, spW = w * 0.26, spH = h * 0.36;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(spX, spY, spW, spH);
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.strokeRect(spX, spY, spW, spH);

      // Stylized speaker
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(spX + spW * 0.5, spY + spH * 0.4, spW * 0.24, 0, Math.PI * 2);
      ctx.fill();

      // Animated mouth speaking
      const mouthOpen = Math.sin(t * 8) > 0.2;
      ctx.fillStyle = '#475569';
      ctx.fillRect(spX + spW * 0.42, spY + spH * (mouthOpen ? 0.48 : 0.46), spW * 0.16, mouthOpen ? 8 : 3);

      ctx.fillStyle = '#4ade80';
      ctx.font = `bold ${Math.round(spH * 0.10)}px monospace`;
      ctx.fillText('● PROF. WARADKAR (LIVE)', spX + 12, spY + spH * 0.90);
    }
  },

  // Scene 3: Breaking News Broadcast
  {
    id: 'breaking-news',
    title: 'Global News 24: International Infrastructure Summit',
    category: 'Breaking News',
    description: 'High-density broadcast news feed with lower-third breaking ticker, financial markets telemetry HUD, and studio anchor.',
    aspectRatio: '16:9',
    regions: [
      {
        id: 'news_markets_hud',
        type: 'PERSISTENT_HUD',
        confidence: 0.97,
        boundingBox: { left: 0.04, top: 0.04, width: 0.44, height: 0.10 },
        textContent: 'GLOBAL MARKETS: NIFTY 25,410 (+1.2%) • S&P 500 5,640 (+0.8%) • BRENT $74.20 (-0.8%)',
        extractedMetrics: {
          nifty: '25,410 (+1.2%)',
          sp500: '5,640 (+0.8%)',
          brent: '$74.20 (-0.8%)'
        },
        adaptationStrategy: {
          action: 'PIN_TO_PERIPHERY',
          anchorCorner: 'TOP_RIGHT',
          scaleFactor: 1.60
        }
      },
      {
        id: 'news_anchor_face',
        type: 'FACIAL_PORTRAIT',
        confidence: 0.99,
        boundingBox: { left: 0.55, top: 0.16, width: 0.35, height: 0.58 },
        textContent: 'News Anchor: Announcing Live Coverage',
        attributes: { mouthOpen: true, dominantEmotion: 'SERIOUS' },
        adaptationStrategy: {
          action: 'SUPER_RESOLVE_AND_STABILIZE',
          contrastBoost: 1.35,
          edgeSharpen: true
        }
      },
      {
        id: 'news_breaking_banner',
        type: 'TEXT_BLOCK',
        confidence: 0.98,
        boundingBox: { left: 0.04, top: 0.78, width: 0.92, height: 0.18 },
        textContent: 'BREAKING NEWS: Supreme Court issues landmark clearance for 4,500km High-Speed Renewable Grid Corridor across all major industrial states.',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.5,
            fontWeight: '800',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      }
    ],
    canvasRender: (ctx, w, h, t) => {
      // News studio background
      const studioGrad = ctx.createLinearGradient(0, 0, w, h);
      studioGrad.addColorStop(0, '#020617');
      studioGrad.addColorStop(0.6, '#0f172a');
      studioGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = studioGrad;
      ctx.fillRect(0, 0, w, h);

      // Studio world map backdrop
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h * 0.75);
        ctx.stroke();
      }

      // Markets HUD Bar (Top Left)
      const mX = w * 0.04, mY = h * 0.04, mW = w * 0.44, mH = h * 0.10;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(mX, mY, mW, mH);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(mX, mY, mW, mH);

      ctx.fillStyle = '#4ade80';
      ctx.font = `bold ${Math.round(mH * 0.38)}px monospace`;
      ctx.fillText('NIFTY 25,410 ▲ +1.2%  •  S&P 5,640 ▲ +0.8%', mX + 16, mY + mH * 0.62);

      // Anchor Silhouette / Portrait box (Center Right)
      const aX = w * 0.55, aY = h * 0.16, aW = w * 0.35, aH = h * 0.58;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(aX, aY, aW, aH);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2;
      ctx.strokeRect(aX, aY, aW, aH);

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(aX + aW * 0.5, aY + aH * 0.34, aW * 0.22, 0, Math.PI * 2);
      ctx.fill();

      // Studio Blazer
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(aX + aW * 0.18, aY + aH * 0.58, aW * 0.64, aH * 0.42);

      // Breaking News Chyron (Bottom)
      const chX = w * 0.04, chY = h * 0.78, chW = w * 0.92, chH = h * 0.18;
      ctx.fillStyle = '#b91c1c'; // Red header
      ctx.fillRect(chX, chY, chW, chH * 0.35);

      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${Math.round(chH * 0.24)}px sans-serif`;
      ctx.fillText('● BREAKING NEWS', chX + 20, chY + chH * 0.26);

      ctx.fillStyle = '#050811'; // Black body
      ctx.fillRect(chX, chY + chH * 0.35, chW, chH * 0.65);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2;
      ctx.strokeRect(chX, chY, chW, chH);

      ctx.fillStyle = '#fde047';
      ctx.font = `bold ${Math.round(chH * 0.32)}px sans-serif`;
      ctx.fillText('Supreme Court Approves 4,500km High-Speed Renewable Grid Corridor', chX + 20, chY + chH * 0.78);
    }
  }
];
