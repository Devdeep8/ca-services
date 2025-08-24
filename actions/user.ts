'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { ChangePasswordSchema } from '@/components/profile-module/schemas';

// THIS IS THE FIX: A dedicated schema for the server action's data.
// It correctly expects a string URL for the avatar, not a File object.
const ProfileUpdateDataSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  avatar: z.string().url("Invalid URL format.").optional().nullable(), // Expects a valid URL, optional, or null
});

export async function updateProfile(
  userId: string, 
  // The data from the client after the image has been uploaded
  values: { name: string; avatar?: string | null; }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.id !== userId) {
    return { error: 'Unauthorized' };
  }

  // Validate the incoming data against the NEW server-side schema
  const validatedFields = ProfileUpdateDataSchema.safeParse(values);

  if (!validatedFields.success) {
    // This is where your error was coming from. It will now pass.
    console.error("Zod validation failed on server:", validatedFields.error.flatten().fieldErrors);
    return { error: 'Invalid data provided.' };
  }

  const { name, avatar } = validatedFields.data;

  // Prepare data for the database, only including avatar if it was changed
  const dataToUpdate: { name: string; avatar?: string | null } = { name };
  if (avatar !== undefined) {
    dataToUpdate.avatar = avatar;
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    revalidatePath(`/profile/${userId}`);
    revalidatePath(`/profile/${userId}/edit`);
    return { success: 'Profile updated successfully!' };
  } catch (error) {
    return { error: 'Failed to update profile.' };
  }
}

// Your `changePassword` function is correct and needs no changes.
export async function changePassword(
  userId: string,
  values: z.infer<typeof ChangePasswordSchema>
) {
  // ... (no changes needed to this function)
  const session = await getServerSession(authOptions);
  if (!session || session.user.id !== userId) {
    return { error: 'Unauthorized' };
  }
  
  const validatedFields = ChangePasswordSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: 'Invalid data.' };
  }

  const { currentPassword, newPassword } = validatedFields.data;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.password) {
    return { error: "User not found or password not set." };
  }

  const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordCorrect) {
    return { error: "Incorrect current password." };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });
  
  return { success: "Password changed successfully!" };
}