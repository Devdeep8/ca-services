import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/utils/helper-server-function";
import { validateSignUpInput, hashPassword, createUser } from "@/components/auth-module/auth-helpers";
/**
 * Handles user sign-up
 * @name POST /api/auth/sign-up
 * @param {NextRequest} req Request object
 * @returns {NextResponse} Response object
 * @throws {Error} If there is an error during user registration
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { name, email, password } = validateSignUpInput(body);

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser.success === true) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }
    // Hash password
    const hashedPassword = await hashPassword(password);
    // Create user
   const createdUser = await createUser({ name, email, password: hashedPassword });

    return NextResponse.json(
      { message: "User registered successfully." , 
        user: createdUser
       },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


