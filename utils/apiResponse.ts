// lib/api-utils.ts

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/utils/errors'; // Use your actual path

// A map to associate error codes with HTTP status codes for consistency.
const ERROR_CODE_TO_STATUS: { [key: string]: number } = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  UNEXPECTED_ERROR: 500,
};

/**
 * A centralized error handler for API routes.
 * @param error - The error object caught in the try...catch block.
 * @returns A NextResponse object with a structured JSON payload.
 */
export function handleApiError(error: unknown): NextResponse {
  console.log('Handling API error:', error);
  // Handle Zod validation errors first
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: 'Input validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues,
      },
      { status: 400 }
    );
  }

  // Handle our custom AppError and its subclasses
  if (error instanceof AppError) {
    const status = ERROR_CODE_TO_STATUS[error.code] || 500;
    return NextResponse.json(
      {
        message: error.message,
        code: error.code,
        details: error.details || null,
      },
      { status }
    );
  }

  // Handle generic, unexpected errors
  console.error('[UNHANDLED_API_ERROR]', error);
  return NextResponse.json(
    {
      message: 'An unexpected error occurred.',
      code: 'UNEXPECTED_ERROR',
    },
    { status: 500 }
  );
}