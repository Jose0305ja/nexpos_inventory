export interface ApiResponse<T> {
  message: string;
  data: T;
}

export const buildResponse = <T>(
  message: string,
  data: T | null = null,
): ApiResponse<T | null> => ({
  message,
  data,
});
