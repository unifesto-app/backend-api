import { NextRequest } from 'next/server';
import { requireAdminAuth } from '@/lib/request-auth';
import { AdminService } from '@/src/services/admin.service';
import { AdminRepository } from '@/src/repositories/admin.repository';
import { parsePaginationParams, buildPaginationMeta } from '@/src/utils/pagination';
import { ApiResponseBuilder } from '@/src/utils/response';
import { handleError } from '@/src/utils/error-handler';

type Resource = 'settings' | 'audit-logs' | 'api-keys' | 'announcements' | 'categories' | 'roles';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (auth instanceof Response) return auth;

    const repository = new AdminRepository(auth.supabase);
    const service = new AdminService(repository, auth.user.id);

    const { searchParams } = req.nextUrl;
    const resource = searchParams.get('resource') as Resource;

    switch (resource) {
      case 'settings': {
        const data = await service.getSettings();
        return ApiResponseBuilder.success(data);
      }
      case 'audit-logs': {
        const pagination = parsePaginationParams(searchParams);
        const filters = {
          action: searchParams.get('action') ?? undefined,
          module: searchParams.get('module') ?? undefined,
          from: searchParams.get('from') ?? undefined,
          to: searchParams.get('to') ?? undefined,
        };
        const { data, count } = await service.getAuditLogs(pagination, filters);
        const meta = buildPaginationMeta(pagination.page, pagination.limit, count);
        return ApiResponseBuilder.success(data, meta);
      }
      case 'api-keys': {
        const data = await service.getApiKeys();
        return ApiResponseBuilder.success(data);
      }
      case 'announcements': {
        const data = await service.getAnnouncements();
        return ApiResponseBuilder.success(data);
      }
      case 'categories': {
        const data = await service.getCategories();
        return ApiResponseBuilder.success(data);
      }
      case 'roles': {
        const data = await service.getRoles();
        return ApiResponseBuilder.success(data);
      }
      default:
        return ApiResponseBuilder.badRequest('Invalid resource');
    }
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (auth instanceof Response) return auth;

    const repository = new AdminRepository(auth.supabase);
    const service = new AdminService(repository, auth.user.id);

    const resource = req.nextUrl.searchParams.get('resource') as Resource;
    const body = await req.json();

    switch (resource) {
      case 'announcements': {
        const data = await service.createAnnouncement(body);
        return ApiResponseBuilder.created(data);
      }
      case 'api-keys': {
        const data = await service.createApiKey(body);
        return ApiResponseBuilder.created(data);
      }
      case 'categories': {
        const data = await service.createCategory(body);
        return ApiResponseBuilder.created(data);
      }
      case 'roles': {
        const data = await service.createRole(body);
        return ApiResponseBuilder.created(data);
      }
      default:
        return ApiResponseBuilder.badRequest('POST not supported for this resource');
    }
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (auth instanceof Response) return auth;

    const repository = new AdminRepository(auth.supabase);
    const service = new AdminService(repository, auth.user.id);

    const { searchParams } = req.nextUrl;
    const resource = searchParams.get('resource') as Resource;
    const body = await req.json();

    switch (resource) {
      case 'settings': {
        const data = await service.updateSettings(body);
        return ApiResponseBuilder.success(data);
      }
      case 'announcements': {
        const id = searchParams.get('id');
        if (!id) return ApiResponseBuilder.badRequest('id is required');
        const data = await service.updateAnnouncement(id, body);
        return ApiResponseBuilder.success(data);
      }
      case 'roles': {
        const id = searchParams.get('id');
        if (!id) return ApiResponseBuilder.badRequest('id is required');
        const data = await service.updateRole(id, body);
        return ApiResponseBuilder.success(data);
      }
      default:
        return ApiResponseBuilder.badRequest('PATCH not supported for this resource');
    }
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (auth instanceof Response) return auth;

    const repository = new AdminRepository(auth.supabase);
    const service = new AdminService(repository, auth.user.id);

    const { searchParams } = req.nextUrl;
    const resource = searchParams.get('resource') as Resource;
    const id = searchParams.get('id');
    if (!id) return ApiResponseBuilder.badRequest('id is required');

    switch (resource) {
      case 'api-keys':
        await service.deleteApiKey(id);
        return ApiResponseBuilder.noContent();
      case 'categories':
        await service.deleteCategory(id);
        return ApiResponseBuilder.noContent();
      case 'announcements':
        await service.deleteAnnouncement(id);
        return ApiResponseBuilder.noContent();
      case 'roles':
        await service.deleteRole(id);
        return ApiResponseBuilder.noContent();
      default:
        return ApiResponseBuilder.badRequest('DELETE not supported for this resource');
    }
  } catch (error) {
    return handleError(error);
  }
}
