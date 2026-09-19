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
  // Scene 1: AWS Serverless Architecture & Real-Time Vision Lecture (Hero Demo for AWS Judges)
  {
    id: 'aws-serverless',
    title: 'AWS Certified Solutions Architect: Serverless Deep Dive',
    category: 'AWS Cloud Lecture',
    description: 'Reference architecture breakdown of event-driven zero-latency fan-out across API Gateway, Lambda, DynamoDB, Rekognition, and Polly.',
    aspectRatio: '16:9',
    videoUrl: '/videos/aws_serverless.mp4',
    regions: [
      {
        id: 'aws_lambda_worker',
        type: 'ACTION_ZONE',
        confidence: 0.99,
        boundingBox: { left: 0.28, top: 0.22, width: 0.20, height: 0.19 },
        label: '⚡ AWS Lambda Orchestrator',
        textContent: 'AWS Lambda Python 3.12 (2048 MB) ThreadPool fan-out across Rekognition and Polly in 650ms',
        zoomLevel: 2.6,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'FOVEATED_OPTICAL_ZOOM',
          zoomLevel: 2.6,
          isolationMode: 'SPOTLIGHT'
        }
      },
      {
        id: 'aws_dynamodb_store',
        type: 'PERSISTENT_HUD',
        confidence: 0.99,
        boundingBox: { left: 0.52, top: 0.22, width: 0.18, height: 0.19 },
        label: '🗄️ Amazon DynamoDB',
        textContent: 'Amazon DynamoDB: Single-digit millisecond latency storing user pathology profiles and calibration data',
        zoomLevel: 2.4,
        isolationMode: 'PERIPHERAL_DOCK',
        extractedMetrics: {
          service: 'DynamoDB',
          table: 'UserProfiles',
          latency: '< 5ms'
        },
        adaptationStrategy: {
          action: 'PIN_TO_PERIPHERY',
          anchorCorner: 'TOP_RIGHT',
          scaleFactor: 1.75
        }
      },
      {
        id: 'aws_api_gateway',
        type: 'PERSISTENT_HUD',
        confidence: 0.99,
        boundingBox: { left: 0.07, top: 0.22, width: 0.17, height: 0.19 },
        label: '🌐 Amazon API Gateway',
        textContent: 'Amazon API Gateway: REST API endpoint handling binary JPEG payloads with under 25ms latency',
        zoomLevel: 2.3,
        isolationMode: 'PERIPHERAL_DOCK',
        adaptationStrategy: {
          action: 'PIN_TO_PERIPHERY',
          anchorCorner: 'BOTTOM_LEFT',
          scaleFactor: 1.60
        }
      },
      {
        id: 'aws_rekognition_card',
        type: 'TEXT_BLOCK',
        confidence: 0.98,
        boundingBox: { left: 0.07, top: 0.44, width: 0.30, height: 0.18 },
        label: '👁️ Amazon Rekognition',
        textContent: 'Amazon Rekognition: Real-time OCR text line extraction and facial landmark detection for lip-reading preservation',
        zoomLevel: 2.2,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 1.8,
            fontWeight: 'bold',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'aws_polly_card',
        type: 'TEXT_BLOCK',
        confidence: 0.98,
        boundingBox: { left: 0.39, top: 0.44, width: 0.32, height: 0.18 },
        label: '🔊 Amazon Polly (Neural TTS)',
        textContent: 'Amazon Polly: Neural text-to-speech engine Joanna streaming on-demand screen audio descriptions',
        zoomLevel: 2.2,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 1.8,
            fontWeight: 'bold',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'aws_keynote_speaker',
        type: 'FACIAL_PORTRAIT',
        confidence: 0.96,
        boundingBox: { left: 0.74, top: 0.14, width: 0.22, height: 0.30 },
        label: '👤 Werner Vogels (Keynote)',
        textContent: 'Werner Vogels presenting event-driven serverless architecture at AWS re:Invent',
        zoomLevel: 2.5,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'SUPER_RESOLVE_AND_STABILIZE',
          contrastBoost: 1.6,
          edgeSharpen: true
        }
      },
      {
        id: 'aws_terminal_cli',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        boundingBox: { left: 0.04, top: 0.67, width: 0.92, height: 0.25 },
        label: '💻 AWS Cloud Inference Terminal',
        textContent: 'curl -X POST /api/v1/analyze-frame -> HTTP 200 OK | Latency: 653ms | Entities: [PERSISTENT_HUD, TEXT_BLOCK, ARCHITECTURE_CORRIDOR]',
        zoomLevel: 1.8,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.0,
            fontWeight: 'bold',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      }
    ]
  },
  // Scene 2: Real Amateur Cricket Match (CricHeroes)
  {
    id: 'cricket-match',
    title: 'Amateur Cricket: CricHeroes Spartan Warriors Match',
    category: 'Sports Broadcast',
    description: 'Real match broadcast from CricHeroes featuring Spartan Warriors batting at 84/4 with live scorebar, required run rate, and over balls.',
    aspectRatio: '16:9',
    videoUrl: '/videos/cricket.mp4',
    regions: [
      {
        id: 'cricket_batsman_action',
        type: 'ACTION_ZONE',
        confidence: 0.99,
        boundingBox: { left: 0.27, top: 0.24, width: 0.44, height: 0.54 },
        label: '🏏 Batsman Srihari at Crease',
        textContent: 'Batsman: Srihari (17 runs, 17 balls) in batting stance awaiting delivery',
        zoomLevel: 2.6,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'FOVEATED_OPTICAL_ZOOM',
          zoomLevel: 2.6,
          isolationMode: 'SPOTLIGHT'
        }
      },
      {
        id: 'cricket_bowler_action',
        type: 'ACTION_ZONE',
        confidence: 0.98,
        boundingBox: { left: 0.68, top: 0.30, width: 0.24, height: 0.48 },
        label: '🎯 Bowler Yeshwan (Delivery Stride)',
        textContent: 'Bowler: Yeshwan running in from Pavilion End in delivery stride',
        zoomLevel: 2.2,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'FOVEATED_OPTICAL_ZOOM',
          zoomLevel: 2.2,
          isolationMode: 'SPOTLIGHT'
        }
      },
      {
        id: 'cricket_pitch_action',
        type: 'ACTION_ZONE',
        confidence: 0.97,
        boundingBox: { left: 0.30, top: 0.44, width: 0.38, height: 0.38 },
        label: '⚡ Pitch Corridor & Wickets',
        textContent: 'Good-length corridor outside off stump, dry turf surface',
        zoomLevel: 2.4,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'FOVEATED_OPTICAL_ZOOM',
          zoomLevel: 2.4,
          isolationMode: 'SPOTLIGHT'
        }
      },
      {
        id: 'cricket_spartan_score',
        type: 'PERSISTENT_HUD',
        confidence: 0.99,
        boundingBox: { left: 0.01, top: 0.86, width: 0.38, height: 0.07 },
        label: '📊 Spartan Warriors Scoreboard',
        textContent: 'SPARTAN WARRIORS: 84/4 (10.0 Ov)',
        zoomLevel: 1.8,
        isolationMode: 'PERIPHERAL_DOCK',
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
        label: '🏏 Batter Stats: Srihari & Venkatesh',
        textContent: 'SRIHARI: 17 (17)* • VENKATES: 9 (9)',
        zoomLevel: 1.9,
        isolationMode: 'SPOTLIGHT',
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
        label: '🎯 Bowler Figures: Yeshwan',
        textContent: 'BOWLER: YESHWAN (0-0)',
        zoomLevel: 1.9,
        isolationMode: 'SPOTLIGHT',
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
        label: '📈 Run Rate Equation',
        textContent: 'CURRENT RR: 8.40 • REQ RR: 6.60 • NEED 66 RUNS IN 60 BALLS',
        zoomLevel: 1.8,
        isolationMode: 'SPOTLIGHT',
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
        label: '⚾ Over Ball-by-Ball Summary',
        textContent: 'THIS OVER: 0 • wd • 0 • 1 • 1',
        zoomLevel: 1.8,
        isolationMode: 'SPOTLIGHT',
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
        label: '📺 CricHeroes Broadcast Watermark',
        textContent: 'CRICHEROES LIVE STREAM',
        zoomLevel: 1.6,
        isolationMode: 'SPOTLIGHT',
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
        id: 'aws_lecture_presenter',
        type: 'FACIAL_PORTRAIT',
        confidence: 0.99,
        boundingBox: { left: 0.68, top: 0.18, width: 0.28, height: 0.62 },
        label: '👤 Session Presenter & Speaker',
        textContent: 'AWS Principal Solutions Architect delivering Advanced RAG Architecture code walkthrough',
        zoomLevel: 2.4,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'FOVEATED_OPTICAL_ZOOM',
          zoomLevel: 2.4,
          isolationMode: 'SPOTLIGHT'
        }
      },
      {
        id: 'aws_lecture_diagram',
        type: 'INFOGRAPHIC',
        confidence: 0.99,
        boundingBox: { left: 0.02, top: 0.15, width: 0.64, height: 0.74 },
        label: '📐 Architecture Agenda & Code Hierarchy',
        textContent: 'RAG Architecture Agenda: KnowledgeBases, Advanced Retrieval, and Agentic Routing',
        zoomLevel: 2.0,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'FOVEATED_OPTICAL_ZOOM',
          zoomLevel: 2.0,
          isolationMode: 'SPOTLIGHT'
        }
      },
      {
        id: 'aws_lecture_agenda_title',
        type: 'TEXT_BLOCK',
        confidence: 1.0,
        boundingBox: { left: 0.03, top: 0.05, width: 0.35, height: 0.08 },
        label: '📌 Agenda Title',
        textContent: 'Agenda: Advanced RAG Architectures',
        zoomLevel: 1.8,
        isolationMode: 'SPOTLIGHT',
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
        label: '📑 Slide Point 01',
        textContent: '01: What to expect from the code talk session',
        zoomLevel: 1.8,
        isolationMode: 'SPOTLIGHT',
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
        boundingBox: { left: 0.03, top: 0.34, width: 0.62, height: 0.07 },
        label: '📑 Slide Point 02',
        textContent: '02: Quick overview of Amazon Bedrock KnowledgeBases',
        zoomLevel: 1.8,
        isolationMode: 'SPOTLIGHT',
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
        label: '📑 Slide Point 03',
        textContent: '03: Advance RAG Techniques',
        zoomLevel: 1.8,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 2.2,
            fontWeight: '700',
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
        id: 'news_anchor_portrait',
        type: 'FACIAL_PORTRAIT',
        confidence: 0.99,
        boundingBox: { left: 0.58, top: 0.12, width: 0.38, height: 0.66 },
        label: '🎙️ Studio Anchor (Medical News)',
        textContent: 'Studio Anchor reporting live on clinical trial results for macular degeneration gene therapy',
        zoomLevel: 2.5,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'FOVEATED_OPTICAL_ZOOM',
          zoomLevel: 2.5,
          isolationMode: 'SPOTLIGHT'
        }
      },
      {
        id: 'news_breaking_badge',
        type: 'TEXT_BLOCK',
        confidence: 0.98,
        boundingBox: { left: 0.03, top: 0.04, width: 0.25, height: 0.08 },
        label: '🚨 Breaking News Banner',
        textContent: 'BREAKING NEWS • LIVE: SPECIAL REPORT',
        zoomLevel: 1.7,
        isolationMode: 'SPOTLIGHT',
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
        label: '📰 Lower-Third Headline',
        textContent: 'FDA APPROVES BREAKTHROUGH MACULAR DEGENERATION GENE THERAPY — Phase 3 clinical trials demonstrate 85% visual field retention in elderly patients',
        zoomLevel: 1.9,
        isolationMode: 'SPOTLIGHT',
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
        label: '📈 Global Financial Markets Telemetry',
        textContent: 'MARKETS: S&P 500 5,620.4 (+1.2%) • NASDAQ 18,340.2 (+1.8%) • DOW 41,890.5 (+0.5%) • NIFTY 25,410.8 (+0.9%) • CRUDE OIL $71.40 (-1.1%)',
        zoomLevel: 1.6,
        isolationMode: 'PERIPHERAL_DOCK',
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

