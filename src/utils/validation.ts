// Validation utilities
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateRequired = (value: any, fieldName: string): void => {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
};

export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

export const validatePagination = (page: number, limit: number): void => {
  if (page < 1) throw new ValidationError('Page must be >= 1');
  if (limit < 1 || limit > 100) throw new ValidationError('Limit must be between 1 and 100');
};

export const validateDate = (date: string, fieldName: string): void => {
  if (isNaN(Date.parse(date))) {
    throw new ValidationError(`${fieldName} must be a valid date`);
  }
};
