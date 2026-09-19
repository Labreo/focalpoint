# FocalPoint — 3-Minute Video Demo Master Script & Choreography

> **Target Track**: AWS Hackathon 2026 (First Commit) — **Ship It** Track  
> **Hard Video Limit**: 3 Minutes (180 Seconds)  
> **Target Run Time**: 2 Minutes 45 Seconds (165 Seconds — 15s safety buffer)  
> **Live Production App**: [https://main.d1s5otc6zch586.amplifyapp.com](https://main.d1s5otc6zch586.amplifyapp.com)  
> **API Gateway Endpoint**: `https://xxeqb4odra.execute-api.us-east-1.amazonaws.com/prod`  
> **GitHub Repository**: [https://github.com/Labreo/focalpoint](https://github.com/Labreo/focalpoint)  
> **Relevant Code Files**:
> - [`frontend/app/page.tsx`](file:///Users/sanjaywaradkar/learning/hackathons/first-commit-2026/focalpoint/frontend/app/page.tsx)
> - [`frontend/components/AdaptiveViewport.tsx`](file:///Users/sanjaywaradkar/learning/hackathons/first-commit-2026/focalpoint/frontend/components/AdaptiveViewport.tsx)
> - [`frontend/lib/demo_scenes.ts`](file:///Users/sanjaywaradkar/learning/hackathons/first-commit-2026/focalpoint/frontend/lib/demo_scenes.ts)
> - [`frontend/lib/aws_client.ts`](file:///Users/sanjaywaradkar/learning/hackathons/first-commit-2026/focalpoint/frontend/lib/aws_client.ts)
> - [`backend/handlers/orchestrator.py`](file:///Users/sanjaywaradkar/learning/hackathons/first-commit-2026/focalpoint/backend/handlers/orchestrator.py)

---

## 1. Pre-Recording Setup & Hotkey Cheat Sheet

Before hitting record on OBS Studio or QuickTime:

1. **Browser Display**: Open Google Chrome in full 1080p (`1920x1080`) resolution at 100% zoom.
2. **Audio Capture**: Enable both your microphone and system audio capture in your recording software. You want the video to capture both your live voiceover, the harmonic one-shot lock chime, and the Amazon Polly neural audio stream.
3. **Input Mode**: The application defaults to **Mouse Simulator** (`MOUSE_DEBUG`) with the reticle anchored to your pointer. This guarantees recording stability without webcam lighting artifacts. If you have clean lighting and prefer webcam eye tracking, press **`M`** to toggle WebGazer.
4. **Keyboard Shortcuts**:
   - **`Spacebar`**: Trigger Amazon Polly neural text-to-speech for the active focused region.
   - **`Escape`**: Immediately reset zoom level back to the $1.0\times$ overview.
   - **`1`**: Switch to **AWS Serverless Deep Dive** (Hero Scene).
   - **`2`**: Switch to **CS Deep Learning Lecture**.
   - **`3`**: Switch to **Amateur Cricket Broadcast**.
   - **`4`**: Switch to **Global News Broadcast**.
   - **`M`**: Toggle input tracking mode (Mouse Simulator vs. WebGazer Eye Tracker).

---

## 2. Master Shot-by-Shot Choreography Table

| Time Window | Visual Cue & On-Screen Action | Exact Spoken Voiceover Script | AWS Services Highlighted |
|---|---|---|---|
| **0:00 – 0:14** | **Shot 1: The Status Quo**<br>Full screen showing standard dense AWS documentation slide with small diagrams and code text. | "Over two hundred million people worldwide live with visual impairments like macular degeneration and glaucoma. When attempting to learn technical skills through video lectures, they run into an impossible barrier." | Context & Motivation |
| **0:14 – 0:26** | **Shot 2: The Magnifier Failure**<br>Trigger OS or browser zoom ($300\%$). The entire screen blows up into blurry pixels, pushing the presenter out of view and panning disorientingly. | "Standard screen magnifiers enlarge every pixel equally. When you zoom in on a small code block, the speaker vanishes, diagrams get cut off, and you lose spatial orientation within seconds." | Assistive Tech Gap |
| **0:26 – 0:38** | **Shot 3: Enter FocalPoint**<br>Cut to FocalPoint at [main.d1s5otc6zch586.amplifyapp.com](https://main.d1s5otc6zch586.amplifyapp.com). Centered retro monitor frame with CRT scanlines and Atkinson Hyperlegible high-contrast typography. | "FocalPoint solves this through an intelligent assistive viewport. Instead of scaling pixels blindly, it parses the video stream semantically and dynamically adapts the layout to the viewer's gaze." | FocalPoint Frontend on AWS Amplify |
| **0:38 – 0:54** | **Shot 4: Gaze Lock & Optical Expansion**<br>Smoothly move the pointer over the **⚡ AWS Lambda Orchestrator** box. The circular reticle centers over it. The amber dwell progress ring completes, accompanied by a clean two-tone chime. The viewport smoothly zooms to $2.6\times$ into the Lambda component. | "Watch as I direct my gaze toward the AWS Lambda orchestrator box. Within 280 milliseconds of steady fixation, the reticle confirms focus with an auditory chime and optically magnifies the component." | Dynamic Viewport Scaling ($2.6\times$) |
| **0:54 – 1:06** | **Shot 5: Preferred Retinal Locus Isolation**<br>Background dims into a darkened spotlight. Active region is docked in the upper-right clear field. Hover over the **`🔊 Read Aloud (AWS Polly)`** button and press **`Spacebar`**. | "Because macular degeneration damages central vision, FocalPoint isolates the element into the viewer's preferred retinal locus. Pressing the spacebar triggers neural text-to-speech." | Peripheral Vision Remapping |
| **1:06 – 1:16** | **Shot 6: Amazon Polly Neural Audio Playback**<br>The button pulses amber. Crystal-clear Joanna voice audio plays over the stream. | *"AWS Lambda Python 3.12 2048 MB ThreadPool fan-out across Rekognition and Polly in 650ms."* | **Amazon Polly** (Neural Engine) |
| **1:16 – 1:22** | **Shot 7: Seamless Overview Recovery**<br>Press **`Escape`** or flick mouse to the border. The viewport smoothly glides back to $1.0\times$ overview. | "Pressing Escape returns to the full lecture overview instantly, preserving spatial context." | Gaze Kinematics & Recovery |
| **1:22 – 1:38** | **Shot 8: Cloud Services Overview**<br>Pan down to the **AWS Cloud Services** card showing green status badges for API Gateway, Lambda, Rekognition, Polly, and DynamoDB. Click **`⚡ Run Live AWS Analysis`**. | "Under the hood, FocalPoint runs on an event-driven AWS serverless pipeline. A lightweight client-side edge engine evaluates frame differentials, dispatching keyframes over Amazon API Gateway." | **Amazon API Gateway** & Differential Engine |
| **1:38 – 1:52** | **Shot 9: Serverless Vision Pipeline**<br>The card displays `HTTP 200 OK | Latency: 653ms`. Hover over the CLI terminal region at the bottom of the slide. | "An AWS Lambda function orchestrates simultaneous extraction. Amazon Rekognition identifies text bounding boxes and speaker landmarks, while user pathology profiles are fetched from Amazon DynamoDB in single-digit milliseconds." | **AWS Lambda**, **Amazon Rekognition**, & **Amazon DynamoDB** |
| **1:52 – 2:06** | **Shot 10: Keynote Speaker Lip-Reading**<br>Move pointer to Werner Vogels PIP in the top right. Viewport zooms into the speaker's face with edge sharpening applied. | "When the gaze shifts toward the instructor, the viewport preserves the facial region with contrast enhancement, enabling users with peripheral vision loss to read lips." | Facial Landmark Tracking |
| **2:06 – 2:20** | **Shot 11: Cross-Domain Scene Adapters**<br>Click **`🏏 Cricket Broadcast`** chip (or press **`3`**). Spartan Warriors score HUD is pinned into the top corner with high-contrast amber text. | "FocalPoint adapts across diverse content types. In sports broadcasts, small scoreboard graphics are automatically recognized and pinned into the peripheral vision corridor with high-contrast amber typography." | Dynamic HUD Pinning |
| **2:20 – 2:32** | **Shot 12: Custom Content Pipeline**<br>Click **`📁 Upload Video`** chip. Show the file dropzone and URL input bar. | "Developers and students can upload their own course recordings or link online video streams to apply real-time adaptive accessibility immediately." | Self-Service Ingestion |
| **2:32 – 2:48** | **Shot 13: Summary & Call to Action**<br>Return to the main AWS lecture monitor ($1.0\times$). Display GitHub URL and live deployment badges. | "By combining serverless computer vision on AWS with eye kinematics, FocalPoint turns inaccessible technical media into an interactive learning environment for everyone. FocalPoint is open source and deployed today on AWS Amplify. Thank you for watching." | Conclusion & Open Source Link |

---

## 3. Spoken Teleprompter Script (Continuous Read)

Use this clean continuous version when recording your voiceover track:

```text
Over two hundred million people worldwide live with visual impairments like macular degeneration and glaucoma. When attempting to learn technical skills through video lectures, they run into an impossible barrier.

Standard screen magnifiers enlarge every pixel equally. When you zoom in on a small code block, the speaker vanishes, diagrams get cut off, and you lose spatial orientation within seconds.

FocalPoint solves this through an intelligent assistive viewport. Instead of scaling pixels blindly, it parses the video stream semantically and dynamically adapts the layout to the viewer's gaze.

Watch as I direct my gaze toward the AWS Lambda orchestrator box. Within 280 milliseconds of steady fixation, the reticle confirms focus with an auditory chime and optically magnifies the component.

Because macular degeneration damages central vision, FocalPoint isolates the element into the viewer's preferred retinal locus. Pressing the spacebar triggers neural text-to-speech.

[Amazon Polly: "AWS Lambda Python 3.12 2048 MB ThreadPool fan-out across Rekognition and Polly in 650ms"]

Pressing Escape returns to the full lecture overview instantly, preserving spatial context.

Under the hood, FocalPoint runs on an event-driven AWS serverless pipeline. A lightweight client-side edge engine evaluates frame differentials, dispatching keyframes over Amazon API Gateway.

An AWS Lambda function orchestrates simultaneous extraction. Amazon Rekognition identifies text bounding boxes and speaker landmarks, while user pathology profiles are fetched from Amazon DynamoDB in single-digit milliseconds.

When the gaze shifts toward the instructor, the viewport preserves the facial region with contrast enhancement, enabling users with peripheral vision loss to read lips.

FocalPoint adapts across diverse content types. In sports broadcasts, small scoreboard graphics are automatically recognized and pinned into the peripheral vision corridor with high-contrast amber typography.

Developers and students can upload their own course recordings or link online video streams to apply real-time adaptive accessibility immediately.

By combining serverless computer vision on AWS with eye kinematics, FocalPoint turns inaccessible technical media into an interactive learning environment for everyone. FocalPoint is open source and deployed today on AWS Amplify. Thank you for watching.
```

---

## 4. Video Recording Checklist

- [ ] **Timing Check**: Total read time is between **2:30** and **2:45**. Do not rush.
- [ ] **One-Shot Audio**: Verify that the harmonic lock chime sounds exactly once when locking onto a region and does not buzz continuously.
- [ ] **Amazon Polly Audio**: Verify that clicking the Polly button or pressing Spacebar produces clear voice output from the speakers.
- [ ] **Escape Key Verification**: Verify that pressing Escape smoothly resets zoom back to $1.0\times$.
- [ ] **Screen Resolution**: Record in 16:9 widescreen ($1920\times 1080$).
- [ ] **YouTube Metadata**: Include the live URL (`https://main.d1s5otc6zch586.amplifyapp.com`) and GitHub repo (`https://github.com/Labreo/focalpoint`) in the first 2 lines of the video description.
