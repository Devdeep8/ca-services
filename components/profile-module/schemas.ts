import { z } from "zod";

export const UpdateProfileSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters long." }),
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