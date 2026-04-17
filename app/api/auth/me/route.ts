import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/request-auth';
import { ApiResponseBuilder } from '@/src/utils/response';
import { handleError } from '@/src/utils/error-handler';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { supabase, user } = auth;

    // Fetch user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return ApiResponseBuilder.success({
      id: user.id,
      email: user.email,
      name: profile?.full_name,
      phone: profile?.phone,
      organization: profile?.organization,
      role: profile?.role,
      status: profile?.status,
      created_at: profile?.created_at,
    });
  } catch (error) {
    return handleError(error);
  }
}
