import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ApiResponseBuilder } from '@/src/utils/response';
import { handleError } from '@/src/utils/error-handler';
import { validateRequired, validateEmail } from '@/src/utils/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validation
    validateRequired(email, 'email');
    validateEmail(email);
    validateRequired(password, 'password');

    const supabase = await createClient();

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (!data.user || !data.session) {
      return ApiResponseBuilder.unauthorized('Invalid credentials');
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

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
