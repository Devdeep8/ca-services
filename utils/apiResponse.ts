// utils/apiResponse.ts
import { AppError } from "./errors";

export function formatErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      success: false,
      error: { code: error.code, message: error.message },
    };
  }

  // fallback for unknown errors
  return {
    success: false,
    error: { code: "UNEXPECTED_ERROR", message: "Something went wrong. Please try again." },
  };
}
