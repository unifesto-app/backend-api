import { ValidationError } from './validation';
import { ApiResponseBuilder } from './response';

export const handleError = (error: unknown): Response => {
  console.error('[API Error]', error);

  if (error instanceof ValidationError) {
    return ApiResponseBuilder.badRequest(error.message);
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message);
    
    // Handle common database errors
    if (message.includes('duplicate key')) {
      return ApiResponseBuilder.badRequest('Resource already exists');
    }
    if (message.includes('foreign key')) {
      return ApiResponseBuilder.badRequest('Invalid reference');
    }
    if (message.includes('not found')) {
      return ApiResponseBuilder.notFound('Resource not found');
    }

    return ApiResponseBuilder.serverError(message);
  }

  return ApiResponseBuilder.serverError('An unexpected error occurred');
};
