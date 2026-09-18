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
  // Scene 1: Real Amateur Cricket Match (CricHeroes)
  {
    id: 'cricket-match',
    title: 'Amateur Cricket: CricHeroes Spartan Warriors Match',
    category: 'Sports Broadcast',
    description: 'Real match broadcast from CricHeroes featuring Spartan Warriors batting at 84/4 with live scorebar, required run rate, and over balls.',
    aspectRatio: '16:9',
    videoUrl: '/videos/cricket.mp4',
    regions: [
      {
        id: 'cricket_spartan_score',
        type: 'PERSISTENT_HUD',
        confidence: 0.99,
        boundingBox: { left: 0.01, top: 0.86, width: 0.38, height: 0.07 },
        textContent: 'SPARTAN WARRIORS: 84/4 (10.0 Ov)',
        extractedMetrics: {
          team: 'SPARTAN WARRIORS',
          score: '84/4',
          overs: '10.0'
        },
        adaptationStrategy: {
          action: 'PIN_TO_PERIPHERY',
          anchorCorner: 'BOTTOM_RIGHT',
          scaleFactor: 1.80
        }
      },
      {
        id: 'cricket_batsmen_stats',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        boundingBox: { left: 0.42, top: 0.86, width: 0.34, height: 0.07 },
        textContent: 'SRIHARI: 17 (17)* • VENKATES: 9 (9)',
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
        id: 'cricket_bowler_figures',
        type: 'TEXT_BLOCK',
        confidence: 0.98,
        boundingBox: { left: 0.78, top: 0.86, width: 0.20, height: 0.07 },
        textContent: 'BOWLER: YESHWAN (0-0)',
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
        id: 'cricket_equation_crr',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        boundingBox: { left: 0.01, top: 0.94, width: 0.48, height: 0.05 },
        textContent: 'CURRENT RR: 8.40 • REQ RR: 6.60 • NEED 66 RUNS IN 60 BALLS',
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
        id: 'cricket_over_balls',
        type: 'TEXT_BLOCK',
        confidence: 0.96,
        boundingBox: { left: 0.76, top: 0.94, width: 0.23, height: 0.05 },
        textContent: 'THIS OVER: 0 • wd • 0 • 1 • 1',
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
        id: 'cricket_channel_badge',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        boundingBox: { left: 0.83, top: 0.03, width: 0.16, height: 0.07 },
        textContent: 'CRICHEROES LIVE STREAM',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 1.8,
            fontWeight: '700',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      }
    ],
    canvasRender: (ctx, w, h, t) => {}
  },

  // Scene 2: Real AWS re:Invent Technical Lecture
  {
    id: 'medical-lecture',
    title: 'AWS re:Invent 2025: Advanced RAG & Agentic Architectures',
    category: 'Academic Lecture',
    description: 'Real session footage from AWS re:Invent 2025 (NTA403) presenting generative AI, Bedrock KnowledgeBases, and agentic workflows.',
    aspectRatio: '16:9',
    videoUrl: '/videos/lecture.mp4',
    regions: [
      {
        id: 'aws_lecture_agenda_title',
        type: 'TEXT_BLOCK',
        confidence: 1.0,
        boundingBox: { left: 0.03, top: 0.05, width: 0.22, height: 0.08 },
        textContent: 'Agenda: Advanced RAG Architectures',
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
        id: 'aws_lecture_item_1',
        type: 'TEXT_BLOCK',
        confidence: 0.999,
        boundingBox: { left: 0.03, top: 0.19, width: 0.60, height: 0.07 },
        textContent: '01: What to expect from the code talk session',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.2,
            fontWeight: '700',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'aws_lecture_item_2',
        type: 'TEXT_BLOCK',
        confidence: 0.997,
        boundingBox: { left: 0.03, top: 0.34, width: 0.72, height: 0.07 },
        textContent: '02: Quick overview of Amazon Bedrock KnowledgeBases',
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
        id: 'aws_lecture_item_3',
        type: 'TEXT_BLOCK',
        confidence: 0.999,
        boundingBox: { left: 0.03, top: 0.49, width: 0.40, height: 0.07 },
        textContent: '03: Advance RAG Techniques',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.2,
            fontWeight: '700',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'aws_lecture_item_4',
        type: 'TEXT_BLOCK',
        confidence: 0.998,
        boundingBox: { left: 0.03, top: 0.64, width: 0.35, height: 0.07 },
        textContent: '04: Code walkthrough & implementation',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.2,
            fontWeight: '700',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'aws_lecture_item_5',
        type: 'TEXT_BLOCK',
        confidence: 0.997,
        boundingBox: { left: 0.03, top: 0.79, width: 0.35, height: 0.07 },
        textContent: '05: Further your learning with AWS generative AI',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.2,
            fontWeight: '700',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'aws_lecture_copyright',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        boundingBox: { left: 0.04, top: 0.92, width: 0.35, height: 0.05 },
        textContent: 'aws • © 2025, Amazon Web Services, Inc. or its affiliates. All rights reserved.',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 1.8,
            fontWeight: '600',
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

