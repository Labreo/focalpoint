/**
 * Interactive Demo Broadcast Scenes with Time-Coded Semantic Keyframe Tracks
 * 
 * Provides 4 production-grade interactive broadcast environments
 * with real-time temporal keyframes that interpolate and adapt as the video plays:
 * 1. AWS re:Invent Keynote Architecture Masterclass with Dr. Werner Vogels
 * 2. International Cricket Broadcast Match Highlights (Sanju Samson strike & Farooqi spell)
 * 3. Stanford CS231n Computer Vision Lecture (Cambrian Explosion & Trilobite Ocular Fossil)
 * 4. Reuters World News Broadcast (Red Sea shipping corridor, ISS lab, market ticker)
 */

import { DemoScene } from '../types';

export const DEMO_SCENES: DemoScene[] = [
  // Scene 1: Real AWS re:Invent Keynote Architecture Masterclass with Dr. Werner Vogels
  {
    id: 'aws-serverless',
    title: 'AWS re:Invent: Keynote & Serverless Masterclass',
    category: 'AWS Cloud Lecture',
    description: 'AWS re:Invent architecture masterclass with Dr. Werner Vogels explaining asynchronous serverless event mesh, Lambda fan-out, DynamoDB, Rekognition, and Polly.',
    aspectRatio: '16:9',
    videoUrl: '/videos/aws_serverless.mp4',
    regions: [
      {
        id: 'aws_lambda_orchestrator',
        type: 'ACTION_ZONE',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.26, top: 0.11, width: 0.22, height: 0.25 },
        label: '⚡ AWS Lambda Orchestrator (Python 3.12)',
        textContent: 'AWS Lambda Python 3.12 2048 MB ThreadPool fan-out across Rekognition and Polly in 650ms',
        zoomLevel: 1.40,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'FOVEATED_OPTICAL_ZOOM',
          zoomLevel: 1.40,
          isolationMode: 'SPOTLIGHT'
        }
      },
      {
        id: 'aws_api_gateway',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.04, top: 0.11, width: 0.20, height: 0.25 },
        label: '🌐 Amazon API Gateway (REST API)',
        textContent: 'Amazon API Gateway: REST API endpoint handling binary JPEG payloads with under 25ms latency',
        zoomLevel: 1.35,
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
        id: 'aws_dynamodb_store',
        type: 'PERSISTENT_HUD',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.50, top: 0.11, width: 0.20, height: 0.25 },
        label: '🗄️ Amazon DynamoDB: Pathology Profiles',
        textContent: 'Amazon DynamoDB: Single-digit millisecond latency storing user pathology profiles and calibration data',
        zoomLevel: 1.35,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'PIN_TO_PERIPHERY',
          anchorCorner: 'BOTTOM_RIGHT',
          scaleFactor: 1.30
        }
      },
      {
        id: 'aws_keynote_speaker',
        type: 'FACIAL_PORTRAIT',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.72, top: 0.11, width: 0.25, height: 0.38 },
        label: '👤 Dr. Werner Vogels (Lip-Reading Focus)',
        textContent: 'Dr. Werner Vogels, VP & CTO Amazon.com. Viewport tracks presenter with edge sharpening and contrast enhancement to enable users with peripheral vision loss to read lips.',
        zoomLevel: 1.35,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'SUPER_RESOLVE_AND_STABILIZE',
          contrastBoost: 1.35,
          edgeSharpen: true
        }
      },
      {
        id: 'aws_rekognition_card',
        type: 'ACTION_ZONE',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.04, top: 0.40, width: 0.21, height: 0.24 },
        label: '👁️ Amazon Rekognition: Text & Facial Mesh',
        textContent: 'Amazon Rekognition: Real-time OCR text line extraction and facial landmark detection for lip-reading preservation',
        zoomLevel: 1.40,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'FOVEATED_OPTICAL_ZOOM',
          zoomLevel: 1.40,
          isolationMode: 'SPOTLIGHT'
        }
      },
      {
        id: 'aws_polly_card',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.28, top: 0.40, width: 0.21, height: 0.24 },
        label: '🔊 Amazon Polly: Neural Audio Description',
        textContent: 'Amazon Polly: Neural text-to-speech engine Joanna streaming on-demand screen audio descriptions',
        zoomLevel: 1.40,
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
        id: 'aws_cloudwatch_terminal',
        type: 'ACTION_ZONE',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.04, top: 0.67, width: 0.92, height: 0.30 },
        label: '📊 Live CloudWatch Event Telemetry Stream',
        textContent: 'FocalPoint serverless vision telemetry: POST /analyze HTTP/1.1 200 OK | End-to-end latency: 653ms | 6 OCR bounding boxes identified',
        zoomLevel: 1.30,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'FOVEATED_OPTICAL_ZOOM',
          zoomLevel: 1.30,
          isolationMode: 'SPOTLIGHT'
        }
      },
      {
        id: 'aws_header_banner',
        type: 'TEXT_BLOCK',
        confidence: 0.98,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.01, top: 0.01, width: 0.80, height: 0.08 },
        label: '🌐 AWS re:Invent 2026: Masterclass',
        textContent: 'AWS re:Invent 2026 | Masterclass: Low-Latency Assistive Cloud Architectures (Python 3.12)',
        zoomLevel: 1.30,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 1.4,
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
    description: 'Television broadcast highlights with live scorebar HUD, batsman strike stats, bowler figures, and pitch action.',
    aspectRatio: '16:9',
    videoUrl: '/videos/cricket.mp4',
    regions: [
      {
        id: 'cricket_pitch_player',
        type: 'ACTION_ZONE',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.28, top: 0.16, width: 0.44, height: 0.68 },
        label: '🏏 Striker Batsman: Sanju Samson',
        textContent: 'Sanju Samson at the striker crease preparing to face Fazalhaq Farooqi at Arun Jaitley Stadium',
        timeContent: [
          {
            startTime: 0.0,
            endTime: 4.2,
            label: '👤 Striker: Sanju Samson (Focus)',
            textContent: 'Sanju Samson at the striker crease preparing to face seaming delivery'
          },
          {
            startTime: 4.2,
            endTime: 7.8,
            label: '🏃 Bowler Run-Up: Fazalhaq Farooqi',
            textContent: 'Fazalhaq Farooqi bowling delivery from over the wicket'
          },
          {
            startTime: 7.8,
            endTime: 12.0,
            label: '🏏 Boundary Stroke: Cover Drive',
            textContent: 'Exquisite cover drive stroke racing past the infield for FOUR'
          },
          {
            startTime: 12.0,
            endTime: 20.0,
            label: '👥 Striker: Abhishek Sharma (Partner)',
            textContent: 'Abhishek Sharma and Sanju Samson mid-pitch partnership review'
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
        id: 'cricket_match_score',
        type: 'PERSISTENT_HUD',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.01, top: 0.86, width: 0.19, height: 0.12 },
        label: '📊 Spartan Warriors Scoreboard: IND 1-0',
        textContent: 'SPARTAN WARRIORS SCOREBOARD • INDIA 1-0 (0.4 Ov) | Samson 1 (3)',
        zoomLevel: 1.30,
        isolationMode: 'PERIPHERAL_DOCK',
        extractedMetrics: {
          team: 'IND',
          score: '1-0',
          overs: '0.4'
        },
        adaptationStrategy: {
          action: 'PIN_TO_PERIPHERY',
          anchorCorner: 'TOP_RIGHT',
          scaleFactor: 1.40
        }
      },
      {
        id: 'cricket_samson_stats',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.28, top: 0.86, width: 0.21, height: 0.12 },
        label: '🏏 Striker: Samson 1 (3)',
        textContent: 'Striker batsman Sanju Samson: 1 run scored from 3 balls faced',
        zoomLevel: 1.40,
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
        id: 'cricket_abhishek_stats',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.50, top: 0.86, width: 0.20, height: 0.12 },
        label: '🏏 Non-Striker: Abhishek 0 (1)',
        textContent: 'Non-striker Abhishek Sharma: 0 runs from 1 ball faced at runner crease',
        zoomLevel: 1.40,
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
        id: 'cricket_farooqi_stats',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.71, top: 0.86, width: 0.27, height: 0.12 },
        label: '🎯 Bowler: Fazalhaq 0-1 (0.4) 132 kph',
        textContent: 'Opening bowler Fazalhaq Farooqi: 0 wickets for 1 run in 0.4 overs at 132 kilometers per hour',
        zoomLevel: 1.40,
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
      }
    ]
  },

  // Scene 3: Real Stanford CS231n Deep Learning Lecture
  {
    id: 'academic-lecture',
    title: 'Stanford CS231n: Computer Vision Lecture',
    category: 'Academic Lecture',
    description: 'Academic lecture from Stanford University CS231n: Deep Learning for Computer Vision presented by Prof. Fei-Fei Li.',
    aspectRatio: '16:9',
    videoUrl: '/videos/lecture.mp4',
    regions: [
      {
        id: 'lecture_title_banner',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.05, top: 0.01, width: 0.90, height: 0.17 },
        label: "🔬 Evolution's Big Bang: Cambrian Explosion",
        textContent: "Evolution's Big Bang: Cambrian Explosion, 530-540 million years B.C. The sudden emergence of biological visual systems.",
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
        id: 'lecture_trilobite_ocular',
        type: 'INFOGRAPHIC',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.13, top: 0.20, width: 0.38, height: 0.67 },
        label: '👁️ Trilobite Calcite Ocular Fossil',
        textContent: 'Trilobite compound eye: Rigid calcite crystal lenses preserving earliest known biological visual apparatus',
        zoomLevel: 1.40,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'FOVEATED_OPTICAL_ZOOM',
          zoomLevel: 1.40,
          isolationMode: 'SPOTLIGHT'
        }
      },
      {
        id: 'lecture_dickinsonia_fossil',
        type: 'INFOGRAPHIC',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.56, top: 0.17, width: 0.28, height: 0.36 },
        label: '🪨 Dickinsonia Ovoid Fossil',
        textContent: 'Ediacaran-Cambrian ovoid ribbed organism fossil showing early bilateral body plan morphology',
        zoomLevel: 1.40,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'FOVEATED_OPTICAL_ZOOM',
          zoomLevel: 1.40,
          isolationMode: 'SPOTLIGHT'
        }
      },
      {
        id: 'lecture_opabinia_fossil',
        type: 'INFOGRAPHIC',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.56, top: 0.56, width: 0.28, height: 0.34 },
        label: '🔬 Opabinia 5-Eyed Visual Organism',
        textContent: 'Opabinia regalis: Burgess Shale predator featuring 5 compound eyes enabling omnidirectional panoramic field of view',
        zoomLevel: 1.40,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'FOVEATED_OPTICAL_ZOOM',
          zoomLevel: 1.40,
          isolationMode: 'SPOTLIGHT'
        }
      },
      {
        id: 'lecture_instructor_bar',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.00, top: 0.92, width: 1.00, height: 0.08 },
        label: '👤 CS231n Instructors: Fei-Fei Li, Ehsan Adeli, Zane Durante',
        textContent: 'Stanford University CS231n: Deep Learning for Computer Vision — Prof. Fei-Fei Li, Ehsan Adeli, Zane Durante',
        zoomLevel: 1.40,
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
      },
      {
        id: 'lecture_stanford_crest',
        type: 'PERSISTENT_HUD',
        confidence: 0.98,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.74, top: 0.83, width: 0.18, height: 0.08 },
        label: '🏛️ Stanford Computer Science Watermark',
        textContent: 'Stanford University Department of Computer Science',
        zoomLevel: 1.30,
        isolationMode: 'PERIPHERAL_DOCK',
        adaptationStrategy: {
          action: 'PIN_TO_PERIPHERY',
          anchorCorner: 'BOTTOM_RIGHT',
          scaleFactor: 1.30
        }
      }
    ]
  },

  // Scene 4: Real Reuters World News Broadcast
  {
    id: 'global-news',
    title: 'Reuters World News: Global Broadcast',
    category: 'Breaking News',
    description: 'International television news broadcast from Reuters with breaking news lower-third, headline banners, and field reporting.',
    aspectRatio: '16:9',
    videoUrl: '/videos/news.mp4',
    regions: [
      {
        id: 'news_reuters_badge',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.08, top: 0.07, width: 0.14, height: 0.08 },
        label: '🌐 Reuters Broadcast Badge',
        textContent: 'REUTERS World News Live Feed',
        zoomLevel: 1.40,
        isolationMode: 'SPOTLIGHT',
        adaptationStrategy: {
          action: 'DYNAMIC_REFLOW',
          typography: {
            preferredFont: 'Atkinson-Hyperlegible',
            fontSizeRem: 1.4,
            fontWeight: 'bold',
            highContrastTheme: 'YELLOW_ON_BLACK'
          }
        }
      },
      {
        id: 'news_headline_segment',
        type: 'TEXT_BLOCK',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.07, top: 0.64, width: 0.34, height: 0.24 },
        label: '🚨 Breaking Story: China Presses Iran on Red Sea',
        textContent: 'China presses Iran to rein in Houthi attacks in Red Sea or risk damaging business ties with Beijing',
        timeContent: [
          {
            startTime: 0.0,
            endTime: 8.5,
            label: '🚨 Breaking: China Presses Iran on Red Sea',
            textContent: 'China presses Iran to rein in maritime attacks in Red Sea commercial corridors'
          },
          {
            startTime: 8.5,
            endTime: 20.0,
            label: '🛰️ Story: Drugs in Space (ISS Research)',
            textContent: 'Drugs in space: Pharmaceutical companies launch microgravity protein crystal research aboard Space Station'
          }
        ],
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
      },
      {
        id: 'news_video_broll',
        type: 'ACTION_ZONE',
        confidence: 0.99,
        startTime: 0.0,
        endTime: 20.0,
        boundingBox: { left: 0.35, top: 0.10, width: 0.60, height: 0.75 },
        label: '📹 Broadcast Field Segment',
        textContent: 'International news field footage: Commercial shipping corridors, ISS microgravity laboratory, pharmaceutical cleanrooms',
        timeContent: [
          {
            startTime: 0.0,
            endTime: 8.5,
            label: '🚢 Red Sea Maritime Shipping Corridor',
            textContent: 'Commercial container vessels navigating international shipping lanes'
          },
          {
            startTime: 8.5,
            endTime: 13.5,
            label: '🛰️ International Space Station (ISS Orbit)',
            textContent: 'ISS solar arrays in low Earth orbit conducting biomedical crystallography'
          },
          {
            startTime: 13.5,
            endTime: 20.0,
            label: '🔬 Pharmaceutical Cleanroom Lab',
            textContent: 'Biomedical researchers formulating drug therapies under sterile cleanroom standards'
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
        id: 'news_nasa_logo',
        type: 'PERSISTENT_HUD',
        confidence: 0.98,
        startTime: 8.5,
        endTime: 13.5,
        boundingBox: { left: 0.86, top: 0.08, width: 0.09, height: 0.12 },
        label: '🚀 NASA Agency Insignia',
        textContent: 'National Aeronautics and Space Administration official feed',
        zoomLevel: 1.30,
        isolationMode: 'PERIPHERAL_DOCK',
        adaptationStrategy: {
          action: 'PIN_TO_PERIPHERY',
          anchorCorner: 'TOP_RIGHT',
          scaleFactor: 1.30
        }
      }
    ]
  }
];
