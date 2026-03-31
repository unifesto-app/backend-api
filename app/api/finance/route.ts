// Function 6 — /api/finance
// ?type=transactions|invoices|payouts
// GET   → list records
// POST  → create (invoices, payouts only)
// PATCH → update status (?id=)

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

type FinanceType = 'transactions' | 'invoices' | 'payouts';
const ALLOWED: FinanceType[] = ['transactions', 'invoices', 'payouts'];

export async function GET(req: NextRequest) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const type = (searchParams.get('type') ?? 'transactions') as FinanceType;
  if (!ALLOWED.includes(type)) return Response.json({ success: false, error: 'Invalid type' }, { status: 400 });

  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 20);
  const status = searchParams.get('status') ?? '';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const offset = (page - 1) * limit;

  let query = supabase
    .from(type)
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);

  const { data, error, count } = await query;
  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });

  return Response.json({ success: true, data, meta: { page, limit, total: count ?? 0 } });
}

export async function POST(req: NextRequest) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const type = req.nextUrl.searchParams.get('type') as FinanceType;
  if (!['invoices', 'payouts'].includes(type)) {
    return Response.json({ success: false, error: 'POST only supported for invoices and payouts' }, { status: 400 });
  }

  const body = await req.json();
  const { data, error } = await supabase
    .from(type)
    .insert({ ...body, created_by: user.id })
    .select()
    .single();

  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
  return Response.json({ success: true, data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type') as FinanceType;
  const id = searchParams.get('id');

  if (!ALLOWED.includes(type) || !id) {
    return Response.json({ success: false, error: 'type and id are required' }, { status: 400 });
  }

  const { status } = await req.json();
  const { data, error } = await supabase
    .from(type)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
  return Response.json({ success: true, data });
}
