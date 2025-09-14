import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, organizationName } = await request.json();

    // Validate required fields
    if (!name || !email || !password || !role || !organizationName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create organization
    const organization = await db.organization.create({
      data: {
        name: organizationName,
      },
    });

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as "CA" | "Staff" | "Client",
      },
    });

    // Create membership (user as admin of the organization)
    await db.membership.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: "Admin",
      },
    });

    return NextResponse.json(
      { 
        message: "User created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        organization: {
          id: organization.id,
          name: organization.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}