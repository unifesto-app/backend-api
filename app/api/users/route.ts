import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/request-auth';
import { UserService } from '@/src/services/user.service';
import { UserRepository } from '@/src/repositories/user.repository';
import { parsePaginationParams, buildPaginationMeta } from '@/src/utils/pagination';
import { ApiResponseBuilder } from '@/src/utils/response';
import { handleError } from '@/src/utils/error-handler';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const repository = new UserRepository(auth.supabase);
    const service = new UserService(repository);

    const { searchParams } = req.nextUrl;
    const pagination = parsePaginationParams(searchParams);
    const filters = {
      search: searchParams.get('search') ?? undefined,
      role: searchParams.get('role') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    };

    const { data, count } = await service.listUsers(pagination, filters);
    const meta = buildPaginationMeta(pagination.page, pagination.limit, count);

    return ApiResponseBuilder.success(data, meta);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const repository = new UserRepository(auth.supabase);
    const service = new UserService(repository);

    const body = await req.json();
    const data = await service.createUser(body);

    return ApiResponseBuilder.created(data);
  } catch (error) {
    return handleError(error);
  }
}
