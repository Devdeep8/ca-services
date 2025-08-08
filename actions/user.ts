'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { UpdateProfileSchema } from '@/components/profile-module/schemas';
import { ChangePasswordSchema } from '@/components/profile-module/schemas';
// Define the schema here to reuse it on the client


// The action now accepts a validated 'values' object
export async function updateProfile(
  userId: string, 
  values: z.infer<typeof UpdateProfileSchema>
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.id !== userId) {
    return { error: 'Unauthorized' };
  }

  // The data is already validated on the client, but we can re-validate on the server for security
  const validatedFields = UpdateProfileSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid data provided.' };
  }

  const { name } = validatedFields.data;

  try {
    await db.user.update({
      where: { id: userId },
      data: { name },
    });

    revalidatePath(`/profile/${userId}`);
    revalidatePath(`/profile/${userId}/edit`);
    return { success: 'Profile updated successfully!' };
  } catch (error) {
    return { error: 'Failed to update profile.' };
  }
}
// Schema for changing password

export async function changePassword(
  userId: string,
  values: z.infer<typeof ChangePasswordSchema>
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    return { error: 'Unauthorized' };
  }

  // Double-check authorization
  if (session.user.id !== userId) {
    return { error: 'You are not authorized to perform this action.' };
  }
  
  // No longer need to parse FormData: const values = Object.fromEntries(formData.entries());

  // Re-validating on the server is a crucial security step
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