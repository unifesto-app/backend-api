import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ApiResponseBuilder } from '@/src/utils/response';
import { handleError } from '@/src/utils/error-handler';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get('code');

    if (!code) {
      return ApiResponseBuilder.badRequest('Authorization code is required');
    }

    const supabase = await createClient();

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) throw error;

    if (!data.user || !data.session) {
      return ApiResponseBuilder.unauthorized('Failed to establish session');
    }

    // Fetch or create user profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // If profile doesn't exist, create it (for Google OAuth users)
    if (!profile) {
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          phone: data.user.user_metadata?.phone,
          organization: data.user.user_metadata?.organization,
          role: 'attendee',
          status: 'active',
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
      } else {
        profile = newProfile;
      }
    }

    return ApiResponseBuilder.success({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.full_name,
        phone: profile?.phone,
        organization: profile?.organization,
        role: profile?.role,
      },
      session: data.session,
    });
  } catch (error) {
    return handleError(error);
  }
}
