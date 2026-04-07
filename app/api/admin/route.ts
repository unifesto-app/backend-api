// Function 7 — /api/admin
// ?resource=settings|audit-logs|api-keys|announcements|categories|roles
// GET    → fetch resource
// POST   → create (announcements, api-keys, categories, roles)
// PATCH  → update (settings, announcements ?id=, roles ?id=)
// DELETE → delete (api-keys, categories, announcements, roles ?id=)

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { requireAdminAuth } from '@/lib/request-auth';

type Resource = 'settings' | 'audit-logs' | 'api-keys' | 'announcements' | 'categories' | 'roles';

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { searchParams } = req.nextUrl;
  const resource = searchParams.get('resource') as Resource;

  switch (resource) {
    case 'settings': {
      const { data, error } = await supabase.from('settings').select('*').single();
      if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
      return Response.json({ success: true, data });
    }
    case 'audit-logs': {
      const page = Number(searchParams.get('page') ?? 1);
      const limit = Number(searchParams.get('limit') ?? 50);
      const offset = (page - 1) * limit;
      const action = searchParams.get('action') ?? '';
      const module = searchParams.get('module') ?? '';
      const from = searchParams.get('from') ?? '';
      const to = searchParams.get('to') ?? '';

      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (action) query = query.eq('action', action);
      if (module) query = query.eq('module', module);
      if (from) query = query.gte('created_at', from);
      if (to) query = query.lte('created_at', to);

      const { data, error, count } = await query;
      if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
      return Response.json({ success: true, data, meta: { page, limit, total: count ?? 0 } });
    }
    case 'api-keys': {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, permissions, expires_at, last_used_at, created_at')
        .order('created_at', { ascending: false });
      if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
      return Response.json({ success: true, data });
    }
    case 'announcements': {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
      return Response.json({ success: true, data });
    }
    case 'categories': {
      const { data, error } = await supabase
        .from('categories')
        .select('*, events(count)')
        .order('name');
      if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
      return Response.json({ success: true, data });
    }
    case 'roles': {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, description, permissions, is_system, created_at')
        .order('name');
      if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
      return Response.json({ success: true, data });
    }
    default:
      return Response.json({ success: false, error: 'Invalid resource' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (auth instanceof Response) return auth;
  const { supabase, user } = auth;

  const resource = req.nextUrl.searchParams.get('resource') as Resource;
  const body = await req.json();

  switch (resource) {
    case 'announcements': {
      const { title, message, audience, severity = 'info' } = body;
      if (!title || !message || !audience) {
        return Response.json({ success: false, error: 'title, message and audience are required' }, { status: 400 });
      }
      const { data, error } = await supabase
        .from('announcements')
        .insert({ title, message, audience, severity, created_by: user.id })
        .select().single();
      if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
      return Response.json({ success: true, data }, { status: 201 });
    }
    case 'api-keys': {
      const { name, permissions = 'read', expires_at } = body;
      if (!name) return Response.json({ success: false, error: 'name is required' }, { status: 400 });

      const rawKey = `unif_${crypto.randomBytes(24).toString('hex')}`;
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

      const { data, error } = await supabase
        .from('api_keys')
        .insert({ name, key_hash: keyHash, permissions, expires_at: expires_at ?? null, created_by: user.id })
        .select('id, name, permissions, expires_at, created_at')
        .single();
      if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
      // Raw key returned once only — never stored in plain text
      return Response.json({ success: true, data: { ...data, key: rawKey } }, { status: 201 });
    }
    case 'categories': {
      const { name, slug, description } = body;
      if (!name || !slug) return Response.json({ success: false, error: 'name and slug are required' }, { status: 400 });
      const { data, error } = await supabase
        .from('categories')
        .insert({ name, slug, description })
        .select().single();
      if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
      return Response.json({ success: true, data }, { status: 201 });
    }
    case 'roles': {
      const { name, description, permissions } = body;
      if (!name) return Response.json({ success: false, error: 'name is required' }, { status: 400 });
      const perms = Array.isArray(permissions) ? permissions : [];
      const { data, error } = await supabase
        .from('roles')
        .insert({ name, description: description ?? '', permissions: perms, is_system: false, created_by: user.id })
        .select('id, name, description, permissions, is_system, created_at')
        .single();
      if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
      return Response.json({ success: true, data }, { status: 201 });
    }
    default:
      return Response.json({ success: false, error: 'POST not supported for this resource' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { searchParams } = req.nextUrl;
  const resource = searchParams.get('resource') as Resource;
  const body = await req.json();

  switch (resource) {
    case 'settings': {
      const allowed = [
        'platform_name', 'support_email', 'timezone', 'currency',
        'allow_registration', 'require_email_verification', 'allow_organizer_self_registration', 'maintenance_mode',
        'smtp_host', 'smtp_port', 'smtp_user',
      ];
      const updates = Object.fromEntries(
        Object.entries(body).filter(([k]) => allowed.includes(k))
      );
      const { data, error } = await supabase
        .from('settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', 1)
        .select().single();
      if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
      return Response.json({ success: true, data });
    }
    case 'announcements': {
      const id = searchParams.get('id');
      if (!id) return Response.json({ success: false, error: 'id is required' }, { status: 400 });
      const { data, error } = await supabase
        .from('announcements')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select().single();
      if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
      return Response.json({ success: true, data });
    }
    case 'roles': {
      const id = searchParams.get('id');
      if (!id) return Response.json({ success: false, error: 'id is required' }, { status: 400 });

      const { data: existing, error: existingError } = await supabase
        .from('roles')
        .select('is_system')
        .eq('id', id)
        .single();
      if (existingError) return Response.json({ success: false, error: existingError.message }, { status: 500 });
      if (existing?.is_system) return Response.json({ success: false, error: 'System roles cannot be edited' }, { status: 403 });

      const updates = {
        ...(typeof body.name === 'string' ? { name: body.name } : {}),
        ...(typeof body.description === 'string' ? { description: body.description } : {}),
        ...(Array.isArray(body.permissions) ? { permissions: body.permissions } : {}),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('roles')
        .update(updates)
        .eq('id', id)
        .select('id, name, description, permissions, is_system, created_at')
        .single();
      if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
      return Response.json({ success: true, data });
    }
    default:
      return Response.json({ success: false, error: 'PATCH not supported for this resource' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { searchParams } = req.nextUrl;
  const resource = searchParams.get('resource') as Resource;
  const id = searchParams.get('id');
  if (!id) return Response.json({ success: false, error: 'id is required' }, { status: 400 });

  const tableMap: Partial<Record<Resource, string>> = {
    'api-keys': 'api_keys',
    'categories': 'categories',
    'announcements': 'announcements',
    'roles': 'roles',
  };

  const table = tableMap[resource];
  if (!table) return Response.json({ success: false, error: 'DELETE not supported for this resource' }, { status: 400 });

  if (resource === 'roles') {
    const { data: existing, error: existingError } = await supabase
      .from('roles')
      .select('is_system')
      .eq('id', id)
      .single();
    if (existingError) return Response.json({ success: false, error: existingError.message }, { status: 500 });
    if (existing?.is_system) return Response.json({ success: false, error: 'System roles cannot be deleted' }, { status: 403 });
  }

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
