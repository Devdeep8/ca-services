// lib/auth-helpers.ts
import bcrypt from "bcryptjs";
import { signUpSchema } from "@/lib/validations";
import { db } from "@/lib/db";

export function validateSignUpInput(body: unknown) {
  const parsed = signUpSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(parsed.error.message || "Invalid input");
  }
  return parsed.data;
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 12);
}

interface CreateUserParams {
  name: string;
  email: string;
  password: string;
}

export async function createUser(data: CreateUserParams) {
  return db.user.create({ data });
}
