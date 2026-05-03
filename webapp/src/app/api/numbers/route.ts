// app/api/numbers/route.ts — Save, fetch and delete phone numbers
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/numbers?session_id=xxx
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!sessionId) return NextResponse.json({ error: 'session_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('numbers')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ numbers: data });
}

// POST /api/numbers
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { numbers, source_url, source_label, country, session_id } = body;

  if (!session_id || !numbers?.length) {
    return NextResponse.json({ error: 'session_id and numbers required' }, { status: 400 });
  }

  // Fetch existing numbers to deduplicate
  const { data: existing } = await supabase
    .from('numbers')
    .select('number')
    .eq('session_id', session_id);

  const existingSet = new Set((existing || []).map((r: { number: string }) => r.number));
  const newNumbers = numbers.filter((n: string) => !existingSet.has(n));

  if (!newNumbers.length) return NextResponse.json({ saved: 0 });

  const rows = newNumbers.map((number: string) => ({
    number,
    country: country || 'GH',
    source_url: source_url || '',
    source_label: source_label || new URL(source_url || 'http://unknown').hostname,
    session_id,
  }));

  const { error } = await supabase.from('numbers').insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ saved: newNumbers.length });
}

// DELETE /api/numbers?session_id=xxx
export async function DELETE(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!sessionId) return NextResponse.json({ error: 'session_id required' }, { status: 400 });

  const { error } = await supabase.from('numbers').delete().eq('session_id', sessionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ cleared: true });
}
