export class ResponseHelper {
  static success<T>(message: string, data?: T) {
    return {
      message,
      data: data ?? null,
    };
  }
}
