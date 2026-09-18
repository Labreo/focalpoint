# AGENTS.md — FocalPoint Repository Operational Manual

> **Repository**: `Labreo/focalpoint`  
> **Workspace**: `/Users/sanjaywaradkar/learning/hackathons/first-commit-2026/focalpoint`  
> **Owner**: Kanak Sanjay Waradkar ([@Labreo](https://github.com/Labreo))  
> **Context**: Bharat Builds Tour — First Commit Hackathon (Sept 17–20, 2026)  
> **Target Audience**: Autonomous AI Agents, Coding Assistants, AI Pair Programmers  

---

## 1. Project Mission & System Overview

**FocalPoint** is a gaze-driven, content-aware adaptive media reconstruction system designed for over 350 million individuals living with moderate-to-severe visual impairment (Age-Related Macular Degeneration, Retinitis Pigmentosa, Diabetic Retinopathy, Cataracts, Hemianopia).

Unlike traditional screen magnifiers that perform naive pixel-level zoom (which introduces severe panning fatigue, disorientation, and the *Midas Touch* problem), FocalPoint decomposes remote video broadcasts (televisions, lecture slides, sports chyrons) into structured semantic entities via AWS AI:
- **Text Blocks**: Extracted via OCR and reflowed into readable, high-contrast, scalable Atkinson Hyperlegible paragraphs.
- **Faces**: Isolated, stabilized, and contrast-enhanced for lip-reading comprehension.
- **Scoreboards & Tickers**: Anchored as invariant peripheral HUD overlays in the user's functioning field of vision.
- **Eye Kinematics**: Differentiates involuntary saccades from intentional fixations using an **I-VDT (Velocity & Dispersion Threshold Identification) state machine** and 2D Kalman filtering.
- **Pathology Remapping**: Custom spatial transformations for central scotomas (Preferred Retinal Locus annular projection) and peripheral loss (radial anamorphic compression).

---

## 2. Strict Ground Rules & Asset Hygiene

### 1. The HTML File Ban
* **Never create, emit, or commit `.html` files in this repository.**
* `.gitignore` strictly filters `*.html`.
* All documentation must be pure GitHub Flavored Markdown (`.md`).
* All web UI components must be authored in Next.js / React JSX/TSX (`.tsx`).

### 2. Zero-Hallucination & Credential Security
* Never invent fake AWS APIs or non-existent model endpoints. Always adhere to official AWS SDKs (`boto3` for Python, `@aws-sdk` for Node.js).
* Never hardcode AWS Access Keys, Secret Keys, or session tokens in repository code. Use IAM roles, AWS profile environment variables, or local mocking adapters.

---

## 3. Technology Stack & Architectural Standards

### Frontend Architecture
- **Framework**: Next.js 15 (App Router), React 19, TypeScript (Strict Mode).
- **Styling**: Tailwind CSS + Vanilla CSS custom properties with WCAG 2.2 AAA high-contrast color tokens.
- **Typography**: Atkinson Hyperlegible (Braille Institute) for reading text; JetBrains Mono for telemetry numerals.
- **Eye Tracking**: WebGazer.js integration wrapped in a custom 2D Kalman Filter and I-VDT state machine.
- **Media Ingestion**: WebRTC `navigator.mediaDevices.getDisplayMedia` (screen capture) and HTML5 Video.
- **Graphics & Shaders**: HTML5 Canvas2D / WebGL for real-time contrast stretch and eccentric scotoma simulation.

### Backend & Cloud Architecture (AWS Serverless)
- **Runtime**: Python 3.12 (AWS Lambda).
- **Orchestrator**: Concurrent `ThreadPoolExecutor` fan-out calling:
  - **Amazon Rekognition** `DetectText` (Text extraction & bounding coordinates).
  - **Amazon Rekognition** `DetectFaces` (Facial bounding boxes & landmarks).
  - **Amazon Bedrock** `anthropic.claude-3-5-sonnet-20241022-v2:0` (Multimodal unstructured UI and scoreboard clustering).
- **User Profiles**: Amazon DynamoDB (`FocalPoint_UserProfiles`) storing dwell thresholds, pathology presets, and PRL vectors.
- **Storage**: Amazon S3 (24-hour ephemeral lifecycle bucket for incoming frames).
- **Observability**: Amazon CloudWatch latency and confidence tracking metrics.

---

## 4. Coding & Implementation Guidelines for Agents

### 1. Client-Side Edge Optimization
* Never send 30 FPS video frames to AWS. Always enforce the **Edge-Computed Differential Ingestion Strategy** ($\Delta_{\text{diff}} \ge 0.15$ or $4.0\text{s}$ timeout) to keep AWS cloud latency and costs under control.
* Gaze smoothing must run synchronously at 60 FPS on the client using the Kalman Filter; do not block the UI thread.

### 2. Vestibular Safety & Midas Touch Prevention
* Viewport transformations must never execute on involuntary saccades ($v > 280^\circ/\text{s}$).
* Always enforce the $280\text{ms}$ dwell accumulator threshold before triggering any text reflow drawer or zoom transformation.
* During rapid saccades, apply subtle opacity dampening to avoid peripheral visual strobing.

### 3. Universal Fallback & Accessibility
* Ensure full keyboard navigation is maintained via the **Numpad 1–9 Gaze Simulation Matrix** for testing and for users with severe motor/ocular nystagmus impairments.
* All reflowed text containers must declare `aria-live="polite"` so screen readers can announce fixated text.

---

## 5. Directory Structure Reference

```
focalpoint/
├── AGENTS.md                 # This operational manual
├── README.md                 # Public master architectural documentation
├── .gitignore                # Production ignore rules (*.html, node_modules, etc.)
├── backend/                  # AWS Serverless Lambda & SAM resources
│   ├── handlers/             # orchestrator.py, rekognition_client.py, bedrock_client.py
│   └── template.yaml         # CloudFormation / SAM template
└── frontend/                 # Next.js 15 Client application
    ├── app/                  # App Router pages (master viewer, calibration, profile)
    ├── components/           # AdaptiveViewport, GazeReticle, ReflowDrawer, PersistentHUD
    ├── lib/                  # eye_kinematics.ts, kalman_filter.ts, pathology_transforms.ts
    └── styles/               # globals.css high-contrast WCAG AAA tokens
```
