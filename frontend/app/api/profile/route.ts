import { NextRequest, NextResponse } from 'next/server';

let inMemoryProfileStore: Record<string, any> = {
  'usr_guest': {
    userId: 'usr_guest',
    pathologyType: 'AMD',
    description: 'Age-Related Macular Degeneration',
    dwellThresholdMs: 280,
    maxDispersionPx: 65,
    preferredContrastTheme: 'AMBER',
    fontScaleRem: 2.2,
    prlOffset: { x: 120, y: -80 },
    scotomaRadiusPx: 110,
    tunnelRadiusPx: 220,
    audioHapticEnabled: true
  }
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'usr_guest';
  const awsApiUrl = (process.env.AWS_API_GATEWAY_URL || process.env.NEXT_PUBLIC_AWS_API_URL || '').replace(/\/+$/, '');

  if (awsApiUrl) {
    try {
      const res = await fetch(`${awsApiUrl}/api/v1/profiles/${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (err) {
      console.warn('AWS Profile fetch error, using local cache:', err);
    }
  }

  const profile = inMemoryProfileStore[userId] || inMemoryProfileStore['usr_guest'];
  return NextResponse.json(profile);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId || 'usr_guest';
    const awsApiUrl = (process.env.AWS_API_GATEWAY_URL || process.env.NEXT_PUBLIC_AWS_API_URL || '').replace(/\/+$/, '');

    if (awsApiUrl) {
      try {
        const res = await fetch(`${awsApiUrl}/api/v1/profiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
      } catch (err) {
        console.warn('AWS Profile save error, saving locally:', err);
      }
    }

    inMemoryProfileStore[userId] = {
      ...inMemoryProfileStore['usr_guest'],
      ...body,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(inMemoryProfileStore[userId]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
