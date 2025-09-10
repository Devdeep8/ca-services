import { NextResponse } from 'next/server';
import { z } from 'zod';

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: NextResponse };

export async function validationBodyData<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      error: NextResponse.json(
        { message: 'Invalid JSON body' },
        { status: 400 }
      ),
    };
  }

  const validation = schema.safeParse(body);

  if (!validation.success) {
    return {
      success: false,
      error: NextResponse.json(
        {
          message: 'Invalid input',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: validation.data };
}
