#!/usr/bin/env python3
"""
Generates 3 realistic broadcast sample MP4 videos for FocalPoint:
1. cricket.mp4 - ICC Championship match broadcast with dynamic score overlay
2. lecture.mp4 - Computer Science Deep Learning slide deck presentation
3. news.mp4    - 24/7 Global News broadcast with breaking ticker and chyron
"""

import math
import subprocess
import os
from PIL import Image, ImageDraw, ImageFont

FONT_TITLE = None
FONT_MED = None
FONT_SCORE = None
FONT_SM = None

try:
    FONT_TITLE = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 32)
    FONT_MED = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 22)
    FONT_SCORE = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 26)
    FONT_SM = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 16)
except Exception:
    FONT_TITLE = ImageFont.load_default()
    FONT_MED = ImageFont.load_default()
    FONT_SCORE = ImageFont.load_default()
    FONT_SM = ImageFont.load_default()

WIDTH, HEIGHT = 1280, 720
FPS = 24
DURATION_SEC = 8
TOTAL_FRAMES = FPS * DURATION_SEC

os.makedirs('frontend/public/videos', exist_ok=True)

def render_cricket_video():
    cmd = [
        'ffmpeg', '-y',
        '-f', 'image2pipe',
        '-vcodec', 'ppm',
        '-r', str(FPS),
        '-i', '-',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'fast',
        '-crf', '22',
        'frontend/public/videos/cricket.mp4'
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    for f in range(TOTAL_FRAMES):
        t = f / FPS
        img = Image.new('RGB', (WIDTH, HEIGHT), (16, 48, 28))
        draw = ImageDraw.Draw(img)

        # Stadium grass gradient lines
        for i in range(0, HEIGHT - 180, 40):
            shade = 20 + int(15 * math.sin(i * 0.05 + t))
            draw.rectangle([0, i, WIDTH, i + 20], fill=(12, shade, 22))

        # Boundary ring
        draw.ellipse([-200, 100, WIDTH + 200, HEIGHT - 120], outline=(240, 240, 240, 180), width=4)

        # Pitch crease
        pitch_x1, pitch_y1 = WIDTH // 2 - 80, HEIGHT // 2 - 120
        pitch_x2, pitch_y2 = WIDTH // 2 + 80, HEIGHT // 2 + 120
        draw.rectangle([pitch_x1, pitch_y1, pitch_x2, pitch_y2], fill=(175, 155, 110))
        # Crease white lines
        draw.line([pitch_x1 - 20, pitch_y1 + 30, pitch_x2 + 20, pitch_y1 + 30], fill=(255, 255, 255), width=3)
        draw.line([pitch_x1 - 20, pitch_y2 - 30, pitch_x2 + 20, pitch_y2 - 30], fill=(255, 255, 255), width=3)

        # Moving ball animation
        ball_progress = (t % 2.5) / 2.5
        ball_x = int(WIDTH // 2 - 40 + ball_progress * 80)
        ball_y = int(pitch_y1 + 30 + ball_progress * (pitch_y2 - pitch_y1 - 60))
        draw.ellipse([ball_x - 7, ball_y - 7, ball_x + 7, ball_y + 7], fill=(220, 30, 30), outline=(255, 255, 255))

        # Stumps
        for sx in [-15, 0, 15]:
            draw.rectangle([WIDTH // 2 + sx - 2, pitch_y2 - 30, WIDTH // 2 + sx + 2, pitch_y2 - 10], fill=(240, 220, 180))

        # Top Tournament Badge
        draw.rectangle([40, 30, 420, 75], fill=(15, 20, 35))
        draw.text((55, 42), "ICC CHAMPIONS TROPHY • FINAL", fill=(250, 204, 21), font=FONT_MED)

        # Main Professional Broadcast Scoreboard Bar
        bar_y = HEIGHT - 130
        draw.rectangle([0, bar_y, WIDTH, HEIGHT], fill=(10, 14, 24))
        draw.rectangle([0, bar_y, WIDTH, bar_y + 4], fill=(56, 189, 248))

        # Match Score
        score_text = "IND 242/3 (38.4)  •  TARGET: 318"
        draw.text((60, bar_y + 20), score_text, fill=(255, 255, 255), font=FONT_TITLE)

        # Batsmen & Over Stats
        sub_text = "V. KOHLI: 82* (74b, 8x4, 2x6)  |  S. IYER: 44* (38b, 4x4)  |  CRR: 6.26  REQ: 6.70"
        draw.text((60, bar_y + 65), sub_text, fill=(253, 224, 71), font=FONT_SCORE)

        # Match context badge on right
        draw.rectangle([WIDTH - 320, bar_y + 15, WIDTH - 40, bar_y + 95], fill=(20, 28, 48), outline=(56, 189, 248), width=2)
        draw.text((WIDTH - 300, bar_y + 25), "PROJECTED SCORE", fill=(148, 163, 184), font=FONT_SM)
        draw.text((WIDTH - 300, bar_y + 48), "328 - 345 RUNS", fill=(52, 211, 153), font=FONT_SCORE)

        img.save(proc.stdin, 'PPM')

    proc.stdin.close()
    proc.wait()
    print("Cricket video generated successfully.")

def render_lecture_video():
    cmd = [
        'ffmpeg', '-y',
        '-f', 'image2pipe',
        '-vcodec', 'ppm',
        '-r', str(FPS),
        '-i', '-',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'fast',
        '-crf', '22',
        'frontend/public/videos/lecture.mp4'
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    for f in range(TOTAL_FRAMES):
        t = f / FPS
        img = Image.new('RGB', (WIDTH, HEIGHT), (15, 23, 42))
        draw = ImageDraw.Draw(img)

        # Top Academic Header Bar
        draw.rectangle([0, 0, WIDTH, 80], fill=(30, 41, 59))
        draw.text((50, 22), "STANFORD CS231n: DEEP LEARNING & COMPUTER VISION", fill=(248, 250, 252), font=FONT_TITLE)

        # Subtitle
        draw.text((50, 105), "Lecture 8: Convolutional Architectures & Feature Receptive Fields", fill=(56, 189, 248), font=FONT_SCORE)

        # Main Presentation Slide Content
        points = [
            "• Feature Hierarchy: Low-level Gabor filters → Textures → Motifs → Object classes",
            "• Convolutional Layer: S(i, j) = (I * K)(i, j) = Σ Σ I(m, n) · K(i-m, j-n)",
            "• Non-linear Activation: f(x) = max(0, x) [Rectified Linear Unit]",
            "• Spatial Pooling: Reduces spatial dimensionality and provides translation invariance",
            "• Cross-Entropy Optimization: L = -Σ y_c · log(p_c) via Stochastic Gradient Descent"
        ]

        y_pos = 160
        for pt in points:
            draw.text((60, y_pos), pt, fill=(226, 232, 240), font=FONT_MED)
            y_pos += 52

        # Code Box Preview
        draw.rectangle([60, 440, 880, 620], fill=(2, 6, 23), outline=(71, 85, 105), width=2)
        draw.text((80, 455), "# PyTorch Convolutional Block Definition", fill=(100, 116, 139), font=FONT_SM)
        draw.text((80, 485), "self.conv1 = nn.Conv2d(in_channels=3, out_channels=64, kernel_size=3, padding=1)", fill=(253, 224, 71), font=FONT_SM)
        draw.text((80, 515), "self.bn1   = nn.BatchNorm2d(num_features=64)", fill=(253, 224, 71), font=FONT_SM)
        draw.text((80, 545), "self.relu  = nn.ReLU(inplace=True)", fill=(56, 189, 248), font=FONT_SM)
        draw.text((80, 575), "self.pool  = nn.MaxPool2d(kernel_size=2, stride=2)", fill=(52, 211, 153), font=FONT_SM)

        # Lecturer Camera PIP on Top-Right
        pip_x, pip_y = WIDTH - 340, 105
        draw.rectangle([pip_x, pip_y, pip_x + 280, pip_y + 200], fill=(30, 41, 59), outline=(56, 189, 248), width=3)
        # Lecturer head silhouette
        head_x = pip_x + 140
        head_y = pip_y + 85
        draw.ellipse([head_x - 35, head_y - 45, head_x + 35, head_y + 25], fill=(203, 213, 225))
        draw.ellipse([head_x - 60, head_y + 15, head_x + 60, pip_y + 195], fill=(71, 85, 105))
        draw.text((pip_x + 20, pip_y + 175), "Prof. Andrej Karpathy", fill=(248, 250, 252), font=FONT_SM)

        # Bottom Slide Footer
        draw.rectangle([0, HEIGHT - 50, WIDTH, HEIGHT], fill=(15, 23, 42), outline=(51, 65, 85))
        draw.text((50, HEIGHT - 35), "Stanford University • CS231n Spring Quarter • Slide 18 of 54", fill=(148, 163, 184), font=FONT_SM)

        img.save(proc.stdin, 'PPM')

    proc.stdin.close()
    proc.wait()
    print("Lecture video generated successfully.")

def render_news_video():
    cmd = [
        'ffmpeg', '-y',
        '-f', 'image2pipe',
        '-vcodec', 'ppm',
        '-r', str(FPS),
        '-i', '-',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'fast',
        '-crf', '22',
        'frontend/public/videos/news.mp4'
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    for f in range(TOTAL_FRAMES):
        t = f / FPS
        img = Image.new('RGB', (WIDTH, HEIGHT), (10, 15, 30))
        draw = ImageDraw.Draw(img)

        # Animated broadcast globe background
        for r in range(100, 600, 80):
            draw.ellipse([WIDTH // 2 - r, HEIGHT // 2 - r - 50, WIDTH // 2 + r, HEIGHT // 2 + r - 50], outline=(25, 38, 70), width=2)
        for angle in range(0, 180, 30):
            rad = math.radians(angle + t * 10)
            dx = int(500 * math.cos(rad))
            dy = int(500 * math.sin(rad))
            draw.line([WIDTH // 2 - dx, HEIGHT // 2 - dy - 50, WIDTH // 2 + dx, HEIGHT // 2 + dy - 50], fill=(25, 38, 70), width=2)

        # Anchor Studio Desk
        draw.rectangle([WIDTH // 2 - 180, HEIGHT // 2 - 20, WIDTH // 2 + 180, HEIGHT // 2 + 160], fill=(30, 45, 80), outline=(56, 189, 248), width=2)
        draw.ellipse([WIDTH // 2 - 40, HEIGHT // 2 - 90, WIDTH // 2 + 40, HEIGHT // 2 - 10], fill=(226, 232, 240))
        draw.text((WIDTH // 2 - 50, HEIGHT // 2 + 50), "GLOBAL NEWS", fill=(255, 255, 255), font=FONT_MED)

        # Top Live Header
        draw.rectangle([40, 30, 320, 80], fill=(220, 38, 38))
        draw.text((60, 42), "BREAKING NEWS • LIVE", fill=(255, 255, 255), font=FONT_TITLE)

        time_str = f"14:24:{int(t*2)%60:02d} EST"
        draw.rectangle([WIDTH - 240, 30, WIDTH - 40, 80], fill=(15, 23, 42), outline=(71, 85, 105), width=2)
        draw.text((WIDTH - 220, 42), time_str, fill=(250, 204, 21), font=FONT_SCORE)

        # Lower Third Chyron
        chyron_y = HEIGHT - 180
        draw.rectangle([40, chyron_y, WIDTH - 40, chyron_y + 80], fill=(15, 23, 42), outline=(220, 38, 38), width=3)
        draw.rectangle([40, chyron_y, 220, chyron_y + 80], fill=(220, 38, 38))
        draw.text((55, chyron_y + 25), "SPECIAL REPORT", fill=(255, 255, 255), font=FONT_MED)

        draw.text((240, chyron_y + 14), "FDA APPROVES BREAKTHROUGH MACULAR DEGENERATION GENE THERAPY", fill=(255, 255, 255), font=FONT_SCORE)
        draw.text((240, chyron_y + 46), "Phase 3 clinical trials demonstrate 85% visual field retention in elderly patients", fill=(253, 224, 71), font=FONT_SM)

        # Bottom Scrolling Market Ticker
        ticker_y = HEIGHT - 80
        draw.rectangle([0, ticker_y, WIDTH, HEIGHT], fill=(2, 6, 23))
        draw.rectangle([0, ticker_y, WIDTH, ticker_y + 2], fill=(56, 189, 248))

        ticker_text = "MARKETS:  S&P 500  5,620.4 (+1.2%)   •   NASDAQ  18,340.2 (+1.8%)   •   DOW  41,890.5 (+0.5%)   •   NIFTY 50  25,410.8 (+0.9%)   •   CRUDE OIL  $71.40 (-1.1%)   •   GOLD  $2,580.20 (+0.4%)"
        offset = int((t * 80) % (WIDTH // 2))
        draw.text((60 - offset, ticker_y + 24), ticker_text, fill=(52, 211, 153), font=FONT_SCORE)

        img.save(proc.stdin, 'PPM')

    proc.stdin.close()
    proc.wait()
    print("News video generated successfully.")

if __name__ == '__main__':
    render_cricket_video()
    render_lecture_video()
    render_news_video()
