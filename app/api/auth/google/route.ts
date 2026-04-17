import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ApiResponseBuilder } from '@/src/utils/response';
import { handleError } from '@/src/utils/error-handler';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the redirect URL from request or use default
    const { redirectTo } = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/auth/callback`;

    // Initiate Google OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;

    return ApiResponseBuilder.success({
      url: data.url,
    });
  } catch (error) {
    return handleError(error);
  }
}
