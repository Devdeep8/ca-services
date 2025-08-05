import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workspaceSchema } from "@/lib/validations";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = workspaceSchema.pick({ name: true }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { name } = parsed.data;

  // Get user
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if user already owns a workspace (optional)


  // Create workspace and add user as owner/member
  const workspace = await db.workspace.create({
    data: {
      name,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "OWNER"
        }
      }
    }
  });

  return NextResponse.json({ workspace }, { status: 201 });
}