import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { ApiResponseBuilder } from '@/src/utils/response';
import { handleError } from '@/src/utils/error-handler';
import { validateRequired, validateEmail, ValidationError } from '@/src/utils/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, organization, password, confirmPassword } = body;

    // Validation
    validateRequired(name, 'name');
    validateRequired(email, 'email');
    validateEmail(email);
    validateRequired(phone, 'phone');
    validateRequired(organization, 'organization');
    validateRequired(password, 'password');

    if (password !== confirmPassword) {
      throw new ValidationError('Passwords do not match');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    // Phone validation (10 digits)
    if (!/^\d{10}$/.test(phone)) {
      throw new ValidationError('Phone must be a valid 10-digit number');
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone,
          organization,
        },
      },
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new ValidationError('Failed to create user account');
    }

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email,
      full_name: name,
      phone,
      organization,
      role: 'attendee',
      status: 'active',
    });

    if (profileError) {
      // If profile creation fails, we should ideally delete the auth user
      // but Supabase doesn't allow that from client SDK
      console.error('Profile creation failed:', profileError);
      throw new ValidationError('Failed to create user profile');
    }

    return ApiResponseBuilder.created({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        phone,
        organization,
      },
      session: authData.session,
    });
  } catch (error) {
    return handleError(error);
  }
}
