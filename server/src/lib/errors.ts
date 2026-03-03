export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, string>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, "NOT_FOUND", `${resource} '${id}' not found`);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, string>) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, "CONFLICT", message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ExternalApiError extends AppError {
  constructor(service: string, cause?: string) {
    super(502, "EXTERNAL_API_ERROR", `${service} API error: ${cause || "unknown"}`);
  }
}
