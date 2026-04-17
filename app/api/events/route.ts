// Function 3 — /api/events
// GET  → list events
// POST → create event

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/request-auth';
import { isFkCategoryError, resolveCategory } from '@/lib/events-category';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 20);
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const category = searchParams.get('category') ?? '';
  const date = searchParams.get('date') ?? '';
  const offset = (page - 1) * limit;

  let query = supabase
    .from('events')
    .select('*, organizations(name)', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (search) query = query.ilike('title', `%${search}%`);
  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);
  if (date) query = query.gte('start_date', date);

  const { data, error, count } = await query;
  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });

  return Response.json({ success: true, data, meta: { page, limit, total: count ?? 0 } });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { supabase, user } = auth;

  const body = await req.json();
  const { title, description, start_date, end_date, location, category, organization_id } = body;

  if (!title || !start_date) {
    return Response.json({ success: false, error: 'title and start_date are required' }, { status: 400 });
  }

  const resolvedCategory = await resolveCategory(supabase, category);
  const categoryValue = category ? resolvedCategory?.id ?? null : null;

  if (category && !resolvedCategory) {
    return Response.json({ success: false, error: 'Invalid category. Select an existing category.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      title, description, start_date, end_date,
      location, category: categoryValue, organization_id,
      status: 'draft',
      created_by: user.id,
    })
    .select()
    .single();

  if (error && isFkCategoryError(error.message) && resolvedCategory?.slug) {
    const retry = await supabase
      .from('events')
      .insert({
        title,
        description,
        start_date,
        end_date,
        location,
        category: resolvedCategory.slug,
        organization_id,
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single();

    if (retry.error) return Response.json({ success: false, error: retry.error.message }, { status: 500 });
    return Response.json({ success: true, data: retry.data }, { status: 201 });
  }

  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
  return Response.json({ success: true, data }, { status: 201 });
}
