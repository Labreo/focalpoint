/**
 * Interactive Demo Broadcast Scenes with Time-Coded Semantic Keyframe Tracks
 * 
 * Provides 4 rich, production-grade interactive broadcast environments
 * with real-time temporal keyframes that interpolate and adapt as the video plays:
 * 1. AWS re:Invent Keynote with Dr. Werner Vogels (Speaker walkout, architecture slide transition)
 * 2. International Cricket Broadcast (Bowler run-up trajectory, striker crease stroke, replay HUD)
 * 3. Stanford CS231n Computer Vision Lecture (Title emergence, fossil ocular infographic, instructor bar)
 * 4. Reuters World News Broadcast (Anchor segment, shipping corridor B-roll, live ticker)
 */

import { DemoScene } from '../types';

export const DEMO_SCENES: DemoScene[] = [
  // Scene 1: Real AWS re:Invent Keynote with Dr. Werner Vogels
  {
    id: 'aws-serverless',
    title: 'AWS re:Invent: Keynote with Dr. Werner Vogels',
    category: 'AWS Cloud Lecture',
    description: 'Real keynote presentation from AWS re:Invent with Dr. Werner Vogels explaining asynchronous event-driven cloud systems and live architecture slides.',
    aspectRatio: '16:9',
    videoUrl: '/videos/aws_serverless.mp4',
    regions: [
      {
        id: 'aws_keynote_speaker',
        type: 'FACIAL_PORTRAIT',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.35, top: 0.20, width: 0.28, height: 0.65 },
        keyframes: [
          { time: 0.0, box: { left: 0.35, top: 0.20, width: 0.28, height: 0.65 } },
          { time: 6.0, box: { left: 0.33, top: 0.20, width: 0.29, height: 0.65 } },
          { time: 12.0, box: { left: 0.36, top: 0.21, width: 0.28, height: 0.64 } },
          { time: 20.0, box: { left: 0.35, top: 0.20, width: 0.28, height: 0.65 } }
        ],
        label: '👤 Dr. Werner Vogels (Keynote Speaker)',
        textContent: 'Dr. Werner Vogels, VP & CTO at Amazon.com, presenting event-driven architecture and systems resilience',
        timeContent: [
          {
            startTime: 0.0,
            endTime: 7.0,
            label: '👤 Dr. Werner Vogels (CTO Amazon.com)',
            textContent: 'Werner Vogels addressing AWS re:Invent keynote audience on system failures and asynchronous primitives.'
          },
          {
            startTime: 7.1,
            endTime: 14.0,
            label: '👤 Werner Vogels: Cloud Principles',
            textContent: 'Explaining asynchronous event decoupling: write resilient Lambda functions and immutable state in DynamoDB.'
          },
          {
            startTime: 14.1,
            endTime: 20.0,
            label: '👤 Werner Vogels: Systems Resilience',
            textContent: 'The ultimate thesis: Everything fails all the time. Build observable, distributed serverless applications.'
          }
        ],
        zoomLevel: 1.40,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'SUPER_RESOLVE_AND_STABILIZE',
          contrastBoost: 1.25,
          edgeSharpen: true
        }
      },
      {
        id: 'aws_stage_screen',
        type: 'ACTION_ZONE',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.08, top: 0.10, width: 0.84, height: 0.58 },
        keyframes: [
          { time: 0.0, box: { left: 0.08, top: 0.10, width: 0.84, height: 0.58 } },
          { time: 8.0, box: { left: 0.06, top: 0.08, width: 0.88, height: 0.62 } },
          { time: 16.0, box: { left: 0.08, top: 0.10, width: 0.84, height: 0.58 } }
        ],
        label: '⚡ AWS Architecture Main Stage Screen',
        textContent: 'Event-driven serverless architecture pipeline: API Gateway, Lambda Python 3.12, DynamoDB, Rekognition, and Polly',
        timeContent: [
          {
            startTime: 0.0,
            endTime: 8.0,
            label: '⚡ AWS Main Stage Display',
            textContent: 'AWS Cloud Architecture Stage Display: Global Serverless Event Mesh and Orchestrator.'
          },
          {
            startTime: 8.1,
            endTime: 20.0,
            label: '⚡ Serverless Pipeline Telemetry',
            textContent: 'Active pipeline: API Gateway (25ms) -> Lambda (650ms) -> DynamoDB (3ms) -> Rekognition & Polly.'
          }
        ],
        zoomLevel: 1.35,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'FOVEATED_OPTICAL_ZOOM',
          zoomLevel: 1.35,
          isolationMode: 'SPOTLIGHT'
        }
      },
      {
        id: 'aws_reinvent_banner',
        type: 'TEXT_BLOCK',
        confidence: 0.98,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.03, top: 0.02, width: 0.32, height: 0.09 },
        label: '🌐 AWS re:Invent Live Broadcast',
        textContent: 'AWS re:Invent — Global Cloud Computing Keynote Live from Las Vegas',
        zoomLevel: 1.45,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 1.5,
            fontWeight: 'bold',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'aws_keynote_statement',
        type: 'TEXT_BLOCK',
        confidence: 0.98,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.10, top: 0.74, width: 0.80, height: 0.20 },
        label: '🔊 Architecture Thesis & Live Transcript',
        textContent: 'Everything fails all the time. Build event-driven systems that are observable, resilient, and accessible to everyone.',
        zoomLevel: 1.45,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 1.6,
            fontWeight: 'bold',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      }
    ]
  },

  // Scene 2: Real International Cricket Broadcast Match Highlights
  {
    id: 'cricket-match',
    title: 'International Cricket: Match Highlights',
    category: 'Sports Broadcast',
    description: 'Real international television broadcast highlights with live scorebar HUD, batsman strike stats, bowler figures, and pitch action.',
    aspectRatio: '16:9',
    videoUrl: '/videos/cricket.mp4',
    regions: [
      {
        id: 'cricket_bowler_runup',
        type: 'ACTION_ZONE',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 6.5,
        boundingBox: { left: 0.28, top: 0.20, width: 0.24, height: 0.55 },
        keyframes: [
          { time: 0.0, box: { left: 0.28, top: 0.18, width: 0.22, height: 0.52 } },
          { time: 2.5, box: { left: 0.32, top: 0.22, width: 0.25, height: 0.56 } },
          { time: 5.0, box: { left: 0.36, top: 0.26, width: 0.28, height: 0.60 } },
          { time: 6.5, box: { left: 0.38, top: 0.28, width: 0.30, height: 0.62 } }
        ],
        label: '🏃 Bowler Run-Up: Fazalhaq Farooqi',
        textContent: 'Fazalhaq Farooqi running in from over the wicket, accelerating toward the crease',
        timeContent: [
          {
            startTime: 0.0,
            endTime: 3.5,
            label: '🏃 Bowler Approach Stride',
            textContent: 'Farooqi building pace in the run-up corridor, targeting off-stump line'
          },
          {
            startTime: 3.6,
            endTime: 6.5,
            label: '⚡ Release Point: 137 km/h',
            textContent: 'Delivery release: Left-arm angled delivery into right-handed batsman Sanju Samson'
          }
        ],
        zoomLevel: 1.35,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'FOVEATED_OPTICAL_ZOOM',
          zoomLevel: 1.35,
          isolationMode: 'SPOTLIGHT'
        }
      },
      {
        id: 'cricket_pitch_action',
        type: 'ACTION_ZONE',
        confidence: 0.99,
        startTime: 6.0,
        endTime: 20.0,
        boundingBox: { left: 0.24, top: 0.22, width: 0.52, height: 0.60 },
        keyframes: [
          { time: 6.0, box: { left: 0.24, top: 0.22, width: 0.52, height: 0.60 } },
          { time: 10.0, box: { left: 0.22, top: 0.20, width: 0.56, height: 0.62 } },
          { time: 15.0, box: { left: 0.25, top: 0.22, width: 0.50, height: 0.58 } },
          { time: 20.0, box: { left: 0.24, top: 0.22, width: 0.52, height: 0.60 } }
        ],
        label: '🏏 Batsman Crease & Pitch Replay',
        textContent: 'Sanju Samson defends off the front foot toward mid-off corridor',
        timeContent: [
          {
            startTime: 6.0,
            endTime: 11.0,
            label: '🏏 Defensive Stroke: Samson',
            textContent: 'Solid defensive push to mid-off against full-length seaming delivery'
          },
          {
            startTime: 11.1,
            endTime: 20.0,
            label: '📺 Hawk-Eye Pitch Trajectory Replay',
            textContent: 'Ball pitching on middle-and-off, straightening 1.4° past the defensive blade'
          }
        ],
        zoomLevel: 1.35,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'FOVEATED_OPTICAL_ZOOM',
          zoomLevel: 1.35,
          isolationMode: 'SPOTLIGHT'
        }
      },
      {
        id: 'cricket_spartan_score',
        type: 'PERSISTENT_HUD',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.05, top: 0.86, width: 0.22, height: 0.11 },
        label: '📊 Live Match Score HUD: IND 1-0 (0.4 Ov)',
        textContent: 'INDIA: 1-0 after 0.4 overs at Arun Jaitley Stadium, New Delhi',
        zoomLevel: 1.30,
        isolationMode: 'PERIPHERAL_DOCK',
        extractedMetrics: {
          team: 'IND',
          score: '1-0',
          overs: '0.4'
        },
        adaptationStrategy: {
          action: 'PIN_TO_PERIPHERY',
          anchorCorner: 'BOTTOM_RIGHT',
          scaleFactor: 1.40
        }
      },
      {
        id: 'cricket_batsman_stats',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.29, top: 0.86, width: 0.22, height: 0.08 },
        label: '🏏 Striker Batsman: Samson (1 off 3)',
        textContent: 'SAMSON: 1 run from 3 balls faced',
        zoomLevel: 1.45,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 1.6,
            fontWeight: '800',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'cricket_non_striker',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.51, top: 0.86, width: 0.20, height: 0.08 },
        label: '🏏 Non-Striker: Abhishek (0 off 1)',
        textContent: 'ABHISHEK: 0 runs from 1 ball faced at non-striker end',
        zoomLevel: 1.45,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 1.6,
            fontWeight: '800',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'cricket_bowler_figures',
        type: 'TEXT_BLOCK',
        confidence: 0.98,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.72, top: 0.86, width: 0.24, height: 0.08 },
        label: '🎯 Bowler Figures: Fazalhaq (0-1 0.4)',
        textContent: 'FAZALHAQ: 0 wickets for 1 run in 0.4 overs',
        zoomLevel: 1.45,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 1.5,
            fontWeight: '800',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      }
    ]
  },

  // Scene 3: Real Stanford CS231n Deep Learning Lecture
  {
    id: 'academic-lecture',
    title: 'Stanford CS231n: Computer Vision Lecture',
    category: 'Academic Lecture',
    description: 'Real academic lecture from Stanford University CS231n: Deep Learning for Computer Vision presented by Prof. Fei-Fei Li.',
    aspectRatio: '16:9',
    videoUrl: '/videos/lecture.mp4',
    regions: [
      {
        id: 'lecture_title_header',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.05, top: 0.01, width: 0.90, height: 0.18 },
        label: "🔬 Slide: Evolution's Big Bang (Cambrian Explosion)",
        textContent: "Evolution's Big Bang: Cambrian Explosion, 530-540 million years B.C. The emergence of vision in biological organisms.",
        zoomLevel: 1.45,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 1.7,
            fontWeight: '800',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'lecture_diagram_zone',
        type: 'INFOGRAPHIC',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.06, top: 0.20, width: 0.88, height: 0.62 },
        keyframes: [
          { time: 0.0, box: { left: 0.06, top: 0.20, width: 0.88, height: 0.62 } },
          { time: 10.0, box: { left: 0.05, top: 0.18, width: 0.90, height: 0.64 } },
          { time: 20.0, box: { left: 0.06, top: 0.20, width: 0.88, height: 0.62 } }
        ],
        label: '📊 Cambrian Trilobite & Ocular Evolution Diagram',
        textContent: 'Detailed fossil record infographic displaying ocular development and visual sensory apparatus evolution.',
        timeContent: [
          {
            startTime: 0.0,
            endTime: 9.0,
            label: '📊 Cambrian Trilobite Ocular Fossil',
            textContent: 'Trilobite compound eye structure: Calcite crystal lenses developed 540 million years ago.'
          },
          {
            startTime: 9.1,
            endTime: 20.0,
            label: '📊 Evolution of Biological Vision',
            textContent: 'Predator-prey visual arms race triggered the rapid diversification of morphological body plans.'
          }
        ],
        zoomLevel: 1.40,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'FOVEATED_OPTICAL_ZOOM',
          zoomLevel: 1.40,
          isolationMode: 'SPOTLIGHT'
        }
      },
      {
        id: 'lecture_stanford_crest',
        type: 'PERSISTENT_HUD',
        confidence: 0.98,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.74, top: 0.82, width: 0.18, height: 0.10 },
        label: '🏛️ Stanford University Department Watermark',
        textContent: 'Stanford University Department of Computer Science',
        zoomLevel: 1.30,
        isolationMode: 'PERIPHERAL_DOCK',
        adaptationStrategy: {
          action: 'PIN_TO_PERIPHERY',
          anchorCorner: 'BOTTOM_RIGHT',
          scaleFactor: 1.40
        }
      },
      {
        id: 'lecture_instructor_bar',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.02, top: 0.93, width: 0.70, height: 0.06 },
        label: '👤 Instructors: Fei-Fei Li, Ehsan Adeli, Zane Durante',
        textContent: 'CS231n Instructors: Fei-Fei Li, Ehsan Adeli, Zane Durante — Stanford University',
        zoomLevel: 1.45,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 1.5,
            fontWeight: '700',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      }
    ]
  },

  // Scene 4: Real Reuters World News Broadcast
  {
    id: 'global-news',
    title: 'Reuters World News: Global Broadcast',
    category: 'Breaking News',
    description: 'Real international television news broadcast from Reuters with live breaking news lower-third, headline banners, and video reports.',
    aspectRatio: '16:9',
    videoUrl: '/videos/news.mp4',
    regions: [
      {
        id: 'news_reuters_badge',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.10, top: 0.08, width: 0.15, height: 0.07 },
        label: '🌐 Reuters Official Broadcast Badge',
        textContent: 'REUTERS — World News Live International Feed',
        zoomLevel: 1.45,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 1.5,
            fontWeight: '800',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'news_headline_banner',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.08, top: 0.65, width: 0.45, height: 0.26 },
        label: '🚨 Breaking Story: China Presses Iran on Red Sea Attacks',
        textContent: 'China presses Iran to rein in Houthi attacks in Red Sea or risk damaging business ties with Beijing',
        timeContent: [
          {
            startTime: 0.0,
            endTime: 8.0,
            label: '🚨 Breaking: China Diplomatic Pressure on Iran',
            textContent: 'Beijing urges Tehran to secure commercial navigation or risk bilateral trade disruptions.'
          },
          {
            startTime: 8.1,
            endTime: 20.0,
            label: '🚨 Maritime Shipping Lane Disruptions',
            textContent: 'Global freight rates surge 140% as commercial shipping diverts around Cape of Good Hope.'
          }
        ],
        zoomLevel: 1.45,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 1.7,
            fontWeight: '800',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'news_story_window',
        type: 'ACTION_ZONE',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.48, top: 0.08, width: 0.50, height: 0.84 },
        keyframes: [
          { time: 0.0, box: { left: 0.48, top: 0.08, width: 0.50, height: 0.84 } },
          { time: 10.0, box: { left: 0.46, top: 0.07, width: 0.52, height: 0.85 } },
          { time: 20.0, box: { left: 0.48, top: 0.08, width: 0.50, height: 0.84 } }
        ],
        label: '📹 Maritime Shipping Corridor Footage',
        textContent: 'Commercial container vessels navigating international maritime shipping lanes under naval monitoring',
        zoomLevel: 1.35,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'FOVEATED_OPTICAL_ZOOM',
          zoomLevel: 1.35,
          isolationMode: 'SPOTLIGHT'
        }
      },
      {
        id: 'news_ticker_bar',
        type: 'PERSISTENT_HUD',
        confidence: 0.98,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.0, top: 0.91, width: 1.0, height: 0.09 },
        label: '📈 Live Global Telemetry & News Ticker',
        textContent: 'REUTERS LIVE • MARITIME SECURITY UPDATE • GLOBAL COMMODITY MARKETS MONITOR',
        timeContent: [
          {
            startTime: 0.0,
            endTime: 10.0,
            label: '📈 Markets: Brent Crude $82.40 (+1.4%) • Gold $2,045',
            textContent: 'COMMODITIES: Brent Crude $82.40 (+1.4%) • S&P 500 5,620.4 • NASDAQ +1.8%'
          },
          {
            startTime: 10.1,
            endTime: 20.0,
            label: '📈 Freight: Shanghai Containerized Index +18.2%',
            textContent: 'LOGISTICS: Container transit delays +12 days • Insurance surcharges up 300 bps'
          }
        ],
        zoomLevel: 1.30,
        isolationMode: 'PERIPHERAL_DOCK',
        extractedMetrics: {
          feed: 'REUTERS LIVE',
          topic: 'RED SEA MARITIME TRANSIT'
        },
        adaptationStrategy: {
          action: 'PIN_TO_PERIPHERY',
          anchorCorner: 'BOTTOM_RIGHT',
          scaleFactor: 1.40
        }
      }
    ]
  }
];
