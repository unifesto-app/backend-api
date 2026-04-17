import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { ApiResponseBuilder } from '@/src/utils/response';
import { handleError } from '@/src/utils/error-handler';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return ApiResponseBuilder.success({ message: 'Logged out successfully' });
  } catch (error) {
    return handleError(error);
  }
}
