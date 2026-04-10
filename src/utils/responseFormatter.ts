export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message: string;
  statusCode: number;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    details: string;
  };
  statusCode: number;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

export const formatSuccess = <T>(data: T, message = 'Success', statusCode = 200): SuccessResponse<T> => ({
  success: true,
  data,
  message,
  statusCode,
});

export const formatError = (error: Error | string, message = 'Error', statusCode = 500): ErrorResponse => ({
  success: false,
  error: {
    message,
    details: error instanceof Error ? error.message : error,
  },
  statusCode,
});
