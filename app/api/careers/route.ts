import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET /api/careers - List all careers (public can see active, admins see all)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') || '';
    const department = searchParams.get('department') || '';
    const type = searchParams.get('type') || '';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    let query = supabase
      .from('careers')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (department) {
      query = query.eq('department', department);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching careers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch careers', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/careers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/careers - Create a new career (admin only)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      department,
      location,
      type,
      experience_level,
      description,
      requirements,
      responsibilities,
      benefits,
      salary_range,
      status = 'draft',
    } = body;

    // Validation
    if (!title || !department || !location || !type || !experience_level || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: title, department, location, type, experience_level, description' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('careers')
      .insert({
        title,
        department,
        location,
        type,
        experience_level,
        description,
        requirements: requirements || [],
        responsibilities: responsibilities || [],
        benefits: benefits || [],
        salary_range,
        status,
        posted_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating career:', error);
      return NextResponse.json(
        { error: 'Failed to create career', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/careers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
