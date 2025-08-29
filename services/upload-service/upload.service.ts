// /lib/services/upload.service.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // Your server-side admin client
// No longer need uuid if it's not used elsewhere
// import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file to Supabase Storage using the admin client.
 * This function should only be called from the server.
 * @param fileBuffer The file content as a Buffer.
 * @param fileName The original name of the file.
 * @param userId The ID of the user uploading the file.
 * @returns The public URL of the uploaded file.
 */
export async function uploadFileToServer(
  fileBuffer: Buffer,
  fileName: string,
  userId: string
): Promise<string> {
  const fileExt = fileName.split('.').pop();
  
  // --- MODIFIED LINE ---
  // Replaced uuidv4() with Date.now() for a timestamp-based name
  const newFileName = `${Date.now()}.${fileExt}`;
  
  const filePath = `${userId}/${newFileName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('task-upload') // Your bucket name
    .upload(filePath, fileBuffer, {
      contentType: `file/${fileExt}`, // Set content type to avoid issues
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Supabase admin upload failed: ${uploadError.message}`);
  }

  const { data } = supabaseAdmin.storage
    .from('task-upload')
    .getPublicUrl(filePath);

  return data.publicUrl;
}