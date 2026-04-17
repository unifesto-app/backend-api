// Function 4 — /api/events/[id]
// GET    → single event
// PATCH  → update event
// DELETE → cancel event

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/request-auth';
import { isFkCategoryError, resolveCategory } from '@/lib/events-category';

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

  if ('category' in updates) {
    const rawCategory = updates.category;
    if (rawCategory === null || rawCategory === '') {
      updates.category = null;
    } else {
      const resolvedCategory = await resolveCategory(supabase, rawCategory);
      if (!resolvedCategory) {
        return Response.json({ success: false, error: 'Invalid category. Select an existing category.' }, { status: 400 });
      }
      updates.category = resolvedCategory.id;

      const firstTry = await supabase
        .from('events')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (firstTry.error && isFkCategoryError(firstTry.error.message) && resolvedCategory.slug) {
        const retry = await supabase
          .from('events')
          .update({ ...updates, category: resolvedCategory.slug, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (retry.error) return Response.json({ success: false, error: retry.error.message }, { status: 500 });
        return Response.json({ success: true, data: retry.data });
      }

      if (firstTry.error) return Response.json({ success: false, error: firstTry.error.message }, { status: 500 });
      return Response.json({ success: true, data: firstTry.data });
    }
  }

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
