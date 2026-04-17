import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/request-auth';
import { OrganizationService } from '@/src/services/organization.service';
import { OrganizationRepository } from '@/src/repositories/organization.repository';
import { parsePaginationParams, buildPaginationMeta } from '@/src/utils/pagination';
import { ApiResponseBuilder } from '@/src/utils/response';
import { handleError } from '@/src/utils/error-handler';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const repository = new OrganizationRepository(auth.supabase);
    const service = new OrganizationService(repository);

    const { searchParams } = req.nextUrl;
    const pagination = parsePaginationParams(searchParams);

    const { data, count } = await service.listOrganizations(pagination);
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

    const repository = new OrganizationRepository(auth.supabase);
    const service = new OrganizationService(repository);

    const body = await req.json();
    const data = await service.createOrganization(body);

    return ApiResponseBuilder.created(data);
  } catch (error) {
    return handleError(error);
  }
}
