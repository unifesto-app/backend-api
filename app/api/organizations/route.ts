// Function 5 — /api/organizations
// GET    → list orgs
// POST   → create org
// PATCH  → update org (?id=)
// DELETE → suspend org (?id=)

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 20);
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const offset = (page - 1) * limit;

  let query = supabase
    .from('organizations')
    .select('*, profiles!owner_id(full_name, email)', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (search) query = query.ilike('name', `%${search}%`);
  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });

  return Response.json({ success: true, data, meta: { page, limit, total: count ?? 0 } });
}

export async function POST(req: NextRequest) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { name, owner_id, description } = await req.json();
  if (!name || !owner_id) {
    return Response.json({ success: false, error: 'name and owner_id are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('organizations')
    .insert({ name, owner_id, description, status: 'active' })
    .select()
    .single();

  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
  return Response.json({ success: true, data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return Response.json({ success: false, error: 'id is required' }, { status: 400 });

  const body = await req.json();
  const allowed = ['name', 'description', 'status'];
  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );

  const { data, error } = await supabase
    .from('organizations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
  return Response.json({ success: true, data });
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return Response.json({ success: false, error: 'id is required' }, { status: 400 });

  const { error } = await supabase
    .from('organizations')
    .update({ status: 'suspended', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
