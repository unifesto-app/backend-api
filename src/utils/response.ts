import { ApiResponse, PaginationMeta } from '@/src/types';

export class ApiResponseBuilder {
  static success<T>(data: T, meta?: PaginationMeta): Response {
    const response: ApiResponse<T> = { success: true, data };
    if (meta) response.meta = meta;
    return Response.json(response);
  }

  static created<T>(data: T): Response {
    return Response.json({ success: true, data }, { status: 201 });
  }

  static noContent(): Response {
    return new Response(null, { status: 204 });
  }

  static error(message: string, status: number = 400): Response {
    return Response.json({ success: false, error: message }, { status });
  }

  static badRequest(message: string = 'Bad request'): Response {
    return this.error(message, 400);
  }

  static unauthorized(message: string = 'Unauthorized'): Response {
    return this.error(message, 401);
  }

  static forbidden(message: string = 'Forbidden'): Response {
    return this.error(message, 403);
  }

  static notFound(message: string = 'Not found'): Response {
    return this.error(message, 404);
  }

  static serverError(message: string = 'Internal server error'): Response {
    return this.error(message, 500);
  }
}
