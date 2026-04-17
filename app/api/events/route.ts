import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/request-auth';
import { EventService } from '@/src/services/event.service';
import { EventRepository } from '@/src/repositories/event.repository';
import { parsePaginationParams, buildPaginationMeta } from '@/src/utils/pagination';
import { ApiResponseBuilder } from '@/src/utils/response';
import { handleError } from '@/src/utils/error-handler';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const repository = new EventRepository(auth.supabase);
    const service = new EventService(repository, auth.user.id);

    const { searchParams } = req.nextUrl;
    const pagination = parsePaginationParams(searchParams);
    const filters = {
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      date: searchParams.get('date') ?? undefined,
    };

    const { data, count } = await service.listEvents(pagination, filters);
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

    const repository = new EventRepository(auth.supabase);
    const service = new EventService(repository, auth.user.id);

    const body = await req.json();
    const data = await service.createEvent(body);

    return ApiResponseBuilder.created(data);
  } catch (error) {
    return handleError(error);
  }
}
