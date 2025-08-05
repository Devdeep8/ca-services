import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

function generatePassword(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

async function sendInviteEmail(email: string, password: string, orgName: string) {
  // Configure your SMTP transport
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Your App" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `You're invited to join ${orgName}`,
    html: `
      <p>You have been invited to join <b>${orgName}</b>.</p>
      <p>Your login email: <b>${email}</b></p>
      <p>Your temporary password: <b>${password}</b></p>
      <p>Please log in and change your password after your first login.</p>
    `,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email, workspaceId } = await req.json();
    if (!email || !workspaceId) {
      return NextResponse.json({ error: "Email and workspaceId are required." }, { status: 400 });
    }

    // Check if user exists
    let user = await db.user.findUnique({ where: { email } });
    let generatedPassword: string | null = null;

    if (!user) {
      // Generate and hash password
      generatedPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(generatedPassword, 12);

      // Create a new user with the generated password
      user = await db.user.create({
        data: {
          email,
          name: email.split("@")[0],
          password: hashedPassword,
        },
      });
    }

    // Check if already a member
    const existingMember = await db.workspaceMember.findFirst({
      where: { userId: user.id, workspaceId },
    });
    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this workspace." }, { status: 409 });
    }

    // Add as member
    await db.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId,
        role: "MEMBER",
      },
    });

    // Get org name for email
    const workspace = await db.workspace.findUnique({ where: { id: workspaceId } });

    // Send invite email if user was just created
    if (generatedPassword && workspace) {
      await sendInviteEmail(email, generatedPassword, workspace.name);
    }

    return NextResponse.json({ message: "User invited successfully." }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to invite user." }, { status: 500 });
  }
}