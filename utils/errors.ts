// utils/errors.ts
export class AppError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: string = "UNEXPECTED_ERROR", details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ProjectCreationError extends AppError {
  constructor(message: string, code: string = "VALIDATION_ERROR", details?: any) {
    super(message, code, details);
  }
}
