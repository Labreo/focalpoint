import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body.text || '';
    const voiceId = body.voiceId || 'Joanna';

    if (!text) {
      return NextResponse.json({ error: "Missing 'text' parameter" }, { status: 400 });
    }

    const awsApiUrl = (process.env.AWS_API_GATEWAY_URL || process.env.NEXT_PUBLIC_AWS_API_URL || '').replace(/\/+$/, '');

    if (awsApiUrl) {
      try {
        const awsRes = await fetch(`${awsApiUrl}/api/v1/synthesize-speech`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voiceId })
        });
        if (awsRes.ok) {
          const data = await awsRes.json();
          return NextResponse.json(data);
        }
      } catch (awsErr) {
        console.warn('AWS Polly endpoint unreachable, falling back to client synthesis:', awsErr);
      }
    }

    return NextResponse.json({
      fallbackToWebSpeech: true,
      text,
      voiceId
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
