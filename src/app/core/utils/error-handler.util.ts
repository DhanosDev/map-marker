import { HttpErrorResponse } from '@angular/common/http';

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
}

export const handleApiError = (error: HttpErrorResponse): AppError => {
  if (error.status === 0) {
    return {
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
    };
  }

  return {
    message: error.message || 'An unexpected error occurred',
    code: 'API_ERROR',
    statusCode: error.status,
  };
};
