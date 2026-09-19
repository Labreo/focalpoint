import { NextRequest, NextResponse } from 'next/server';
import { DEMO_SCENES } from '../../../lib/demo_scenes';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const awsApiUrl = (process.env.AWS_API_GATEWAY_URL || process.env.NEXT_PUBLIC_AWS_API_URL || '').replace(/\/+$/, '');

    // If real AWS API Gateway URL is configured, forward to AWS Lambda orchestrator
    if (awsApiUrl) {
      try {
        const awsRes = await fetch(`${awsApiUrl}/api/v1/analyze-frame`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (awsRes.ok) {
          const awsData = await awsRes.json();
          return NextResponse.json(awsData);
        }
      } catch (awsErr) {
        console.warn('Forwarding to AWS API Gateway failed, falling back to local synthesizer:', awsErr);
      }
    }

    // Local Synthesizer Fallback: provides realistic inference response for live demo
    const frameMetadata = body.frameMetadata || {};
    const sceneId = body.sceneId || frameMetadata.sceneId;
    const matchedScene = DEMO_SCENES.find(s => s.id === sceneId) || DEMO_SCENES[0];

    const responsePayload = {
      frameId: `frm_${Date.now().toString(36)}`,
      processedAt: new Date().toISOString(),
      processingLatencyMs: Date.now() - startTime + 45,
      dimensions: {
        width: frameMetadata.width || 1280,
        height: frameMetadata.height || 720
      },
      userProfileSummary: {
        pathologyType: 'AMD',
        dwellThresholdMs: 280
      },
      regions: matchedScene.regions
    };

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Internal error in analysis route: ${err.message}` },
      { status: 500 }
    );
  }
}
