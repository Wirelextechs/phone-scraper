// app/api/scrape/route.ts — Fetch a URL and extract phone numbers
import { NextRequest, NextResponse } from 'next/server';
import { extractPhoneNumbers, Country } from '@/lib/phoneRegex';

export async function POST(req: NextRequest) {
  const { url, country } = await req.json();

  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  try {
    // Fetch the page HTML using the edge runtime
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch page: ${res.status}` }, { status: 400 });
    }

    const html = await res.text();

    // Strip HTML tags for cleaner text extraction
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ');

    const numbers = extractPhoneNumbers(text, (country || 'GH') as Country);

    return NextResponse.json({ numbers, count: numbers.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Scrape failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
