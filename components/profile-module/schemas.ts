import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export const UpdateProfileSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters long." }),
   avatar: z
    .any()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file?.type),
      "Only .jpg, .jpeg, and .png formats are supported."
    )
    .optional(),
});



// 👇 Add this new schema for the change password form
export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, { message: "Current password is required." }),
    newPassword: z.string().min(8, { message: "New password must be at least 8 characters long." }),
    confirmPassword: z.string()
  })
  // Use .refine() to validate that the two new password fields match
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"], // Point the error to the confirmation field
  });