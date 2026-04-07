import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

const BUCKET = 'admin-media';

function normalizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-');
}

export async function GET(req: NextRequest) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 20);
  const search = searchParams.get('search') ?? '';
  const type = searchParams.get('type') ?? '';
  const offset = (page - 1) * limit;

  let query = supabase
    .from('media_files')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (search) query = query.ilike('name', `%${search}%`);
  if (type === 'image') query = query.ilike('mime_type', 'image/%');
  if (type === 'video') query = query.ilike('mime_type', 'video/%');
  if (type === 'document') query = query.or('mime_type.ilike.application/%,mime_type.ilike.text/%');

  const { data, error, count } = await query;
  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });

  return Response.json({ success: true, data, meta: { page, limit, total: count ?? 0 } });
}

export async function POST(req: NextRequest) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return Response.json({ success: false, error: 'file is required' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const safe = normalizeName(file.name || 'upload.bin');
  const filePath = `${user.id}/${Date.now()}-${safe}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, bytes, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) {
    return Response.json({ success: false, error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('media_files')
    .insert({
      name: file.name,
      file_path: filePath,
      file_url: urlData.publicUrl,
      mime_type: file.type || null,
      size_bytes: file.size,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([filePath]);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return Response.json({ success: false, error: 'id is required' }, { status: 400 });

  const { data: existing, error: fetchError } = await supabase
    .from('media_files')
    .select('file_path')
    .eq('id', id)
    .single();

  if (fetchError) return Response.json({ success: false, error: fetchError.message }, { status: 500 });

  const { error: deleteRowError } = await supabase.from('media_files').delete().eq('id', id);
  if (deleteRowError) return Response.json({ success: false, error: deleteRowError.message }, { status: 500 });

  if (existing?.file_path) {
    await supabase.storage.from(BUCKET).remove([existing.file_path]);
  }

  return new Response(null, { status: 204 });
}
