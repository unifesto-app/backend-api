import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';
import { requireAdminAuth } from '@/lib/request-auth';

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (auth instanceof Response) return auth;

  revalidatePath('/', 'layout');
  return Response.json({ success: true });
}
