import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/request-auth';
import { UserService } from '@/src/services/user.service';
import { UserRepository } from '@/src/repositories/user.repository';
import { ApiResponseBuilder } from '@/src/utils/response';
import { handleError } from '@/src/utils/error-handler';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    const repository = new UserRepository(auth.supabase);
    const service = new UserService(repository);

    const data = await service.getUserById(id);
    return ApiResponseBuilder.success(data);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    const repository = new UserRepository(auth.supabase);
    const service = new UserService(repository);

    const body = await req.json();
    const data = await service.updateUser(id, body);

    return ApiResponseBuilder.success(data);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    const repository = new UserRepository(auth.supabase);
    const service = new UserService(repository);

    await service.deleteUser(id);
    return ApiResponseBuilder.noContent();
  } catch (error) {
    return handleError(error);
  }
}
