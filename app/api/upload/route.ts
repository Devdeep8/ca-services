// /app/api/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/utils/getcurrentUser';
import { AppError } from '@/utils/errors';
import { handleApiError } from '@/utils/apiResponse';
import { uploadFileToServer } from '@/services/upload-service/upload.service'; // The service we created earlier

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the user
    const user = await getCurrentUser();
    if (!user) {
      throw new AppError('Authentication required.', 'UNAUTHORIZED');
    }

    // 2. Parse the incoming FormData
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    // 3. Validate that a file was received
    if (!file) {
      throw new AppError('No file was provided in the request.', 'BAD_REQUEST');
    }

    // 4. Convert the file to a Buffer for server-side processing
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 5. Call the secure server-side upload service
    const url = await uploadFileToServer(fileBuffer, file.name, user.id);

    // 6. Return the public URL of the uploaded file
    return NextResponse.json({ url });

  } catch (error) {
    // Handle any errors gracefully
    return handleApiError(error);
  }
}