// Function 4 — /api/events/[id]
// GET    → single event
// PATCH  → update event
// DELETE → cancel event

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/request-auth';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth(_req);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from('events')
    .select('*, organizations(name), registrations(count)')
    .eq('id', id)
    .single();

  if (error) return Response.json({ success: false, error: 'Event not found' }, { status: 404 });
  return Response.json({ success: true, data });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;
  const { id } = await params;

  const body = await req.json();
  const allowed = ['title', 'description', 'start_date', 'end_date', 'location', 'category', 'status'];
  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );

  const { data, error } = await supabase
    .from('events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
  return Response.json({ success: true, data });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth(_req);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;
  const { id } = await params;

  const { error } = await supabase
    .from('events')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
