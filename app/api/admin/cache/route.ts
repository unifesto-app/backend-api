import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export async function POST() {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  revalidatePath('/', 'layout');
  return Response.json({ success: true });
}
