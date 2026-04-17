import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/request-auth';
import { EventService } from '@/src/services/event.service';
import { EventRepository } from '@/src/repositories/event.repository';
import { ApiResponseBuilder } from '@/src/utils/response';
import { handleError } from '@/src/utils/error-handler';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    const repository = new EventRepository(auth.supabase);
    const service = new EventService(repository, auth.user.id);

    const data = await service.getEventById(id);
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
    const repository = new EventRepository(auth.supabase);
    const service = new EventService(repository, auth.user.id);

    const body = await req.json();
    const data = await service.updateEvent(id, body);

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
    const repository = new EventRepository(auth.supabase);
    const service = new EventService(repository, auth.user.id);

    await service.deleteEvent(id);
    return ApiResponseBuilder.noContent();
  } catch (error) {
    return handleError(error);
  }
}
