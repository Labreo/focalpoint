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
    title: 'Live Sports: Cricket Championship Final',
    category: 'Sports Broadcast',
    description: 'Real broadcast cricket match with live lower scoreboard, batting stats, and tournament status.',
    aspectRatio: '16:9',
    videoUrl: '/videos/cricket.mp4',
    regions: [
      {
        id: 'cricket_scoreboard_hud',
        type: 'PERSISTENT_HUD',
        confidence: 0.99,
        boundingBox: { left: 0.02, top: 0.81, width: 0.96, height: 0.18 },
        textContent: 'IND 242/3 (38.4) • V. KOHLI 82* (74b) • S. IYER 44* (38b) • TARGET: 318 • CRR: 6.26 • REQ: 6.70',
        extractedMetrics: {
          team: 'IND',
          score: '242/3',
          overs: '38.4',
          target: '318',
          crr: '6.26',
          req: '6.70'
        },
        adaptationStrategy: {
          action: 'PIN_TO_PERIPHERY',
          anchorCorner: 'BOTTOM_RIGHT',
          scaleFactor: 1.75
        }
      },
      {
        id: 'cricket_tournament_badge',
        type: 'TEXT_BLOCK',
        confidence: 0.98,
        boundingBox: { left: 0.03, top: 0.04, width: 0.32, height: 0.08 },
        textContent: 'ICC CHAMPIONS TROPHY • FINAL: INDIA vs AUSTRALIA',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.0,
            fontWeight: '800',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'cricket_projected_score',
        type: 'TEXT_BLOCK',
        confidence: 0.97,
        boundingBox: { left: 0.74, top: 0.82, width: 0.24, height: 0.14 },
        textContent: 'PROJECTED SCORE: 328 - 345 RUNS • WIN PROBABILITY: 78% IND',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.0,
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

  // Scene 2: Academic Medical & CS Lecture
  {
    id: 'medical-lecture',
    title: 'Academic Lecture: Deep Learning & Computer Vision',
    category: 'Academic Lecture',
    description: 'University presentation slide featuring neural network equations, PyTorch architecture code, and speaker video.',
    aspectRatio: '16:9',
    videoUrl: '/videos/lecture.mp4',
    regions: [
      {
        id: 'lecture_title_text',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        boundingBox: { left: 0.03, top: 0.02, width: 0.88, height: 0.12 },
        textContent: 'STANFORD CS231N: DEEP LEARNING & COMPUTER VISION — Lecture 8',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.4,
            fontWeight: '800',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'lecture_speaker_face',
        type: 'FACIAL_PORTRAIT',
        confidence: 0.98,
        boundingBox: { left: 0.72, top: 0.14, width: 0.24, height: 0.30 },
        textContent: 'Presenter: Prof. Andrej Karpathy (Stanford AI Lab)',
        attributes: { mouthOpen: true, dominantEmotion: 'ENGAGED' },
        adaptationStrategy: {
          action: 'SUPER_RESOLVE_AND_STABILIZE',
          contrastBoost: 1.40,
          edgeSharpen: true
        }
      },
      {
        id: 'lecture_bullet_points',
        type: 'TEXT_BLOCK',
        confidence: 0.97,
        boundingBox: { left: 0.04, top: 0.21, width: 0.68, height: 0.38 },
        textContent: '• Spatial Feature Hierarchy: Edges → Textures → Motifs → Object classes • Convolution Operation: S(i, j) = (I * K)(i, j) • ReLU Activation: max(0, x) • Spatial Pooling for Translation Invariance',
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
        id: 'lecture_pytorch_code',
        type: 'TEXT_BLOCK',
        confidence: 0.96,
        boundingBox: { left: 0.04, top: 0.60, width: 0.68, height: 0.26 },
        textContent: 'self.conv1 = nn.Conv2d(3, 64, kernel_size=3, padding=1) • self.bn1 = nn.BatchNorm2d(64) • self.relu = nn.ReLU() • self.pool = nn.MaxPool2d(2, 2)',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.0,
            fontWeight: '800',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      }
    ],
    canvasRender: (ctx, w, h, t) => {}
  },

  // Scene 3: Breaking News Broadcast
  {
    id: 'breaking-news',
    title: 'Global News 24/7: Retinal Healthcare Breakthrough',
    category: 'Breaking News',
    description: 'High-density broadcast news feed with lower-third breaking ticker, financial markets telemetry HUD, and studio anchor.',
    aspectRatio: '16:9',
    videoUrl: '/videos/news.mp4',
    regions: [
      {
        id: 'news_breaking_badge',
        type: 'TEXT_BLOCK',
        confidence: 0.98,
        boundingBox: { left: 0.03, top: 0.04, width: 0.25, height: 0.08 },
        textContent: 'BREAKING NEWS • LIVE: SPECIAL REPORT',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.0,
            fontWeight: '800',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'news_breaking_banner',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        boundingBox: { left: 0.03, top: 0.72, width: 0.94, height: 0.14 },
        textContent: 'FDA APPROVES BREAKTHROUGH MACULAR DEGENERATION GENE THERAPY — Phase 3 clinical trials demonstrate 85% visual field retention in elderly patients',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.4,
            fontWeight: '800',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'news_markets_hud',
        type: 'PERSISTENT_HUD',
        confidence: 0.97,
        boundingBox: { left: 0.0, top: 0.88, width: 1.0, height: 0.12 },
        textContent: 'MARKETS: S&P 500 5,620.4 (+1.2%) • NASDAQ 18,340.2 (+1.8%) • DOW 41,890.5 (+0.5%) • NIFTY 25,410.8 (+0.9%) • CRUDE OIL $71.40 (-1.1%)',
        extractedMetrics: {
          sp500: '5,620.4 (+1.2%)',
          nasdaq: '18,340.2 (+1.8%)',
          dow: '41,890.5 (+0.5%)'
        },
        adaptationStrategy: {
          action: 'PIN_TO_PERIPHERY',
          anchorCorner: 'BOTTOM_RIGHT',
          scaleFactor: 1.60
        }
      }
    ],
    canvasRender: (ctx, w, h, t) => {}
  }
];

