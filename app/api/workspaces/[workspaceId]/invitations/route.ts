import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceRole, Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendMail } from '@/lib/mail';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const currentUserId = (session.user as { id: string }).id;
    const { workspaceId } = await params;
    const { email } = await request.json();

    if (!email) {
      return new NextResponse(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    const existingMember = await db.workspaceMember.findFirst({
      where: { workspaceId, user: { email } }
    });

    if (existingMember) {
      return new NextResponse(JSON.stringify({ error: 'This user is already a member.' }), { status: 409 });
    }

    // Prepare variables
    let invitationLink: string;
    let tempPassword: string | null = null;
    const existingUser = await db.user.findUnique({ where: { email } });
    const invitationToken = crypto.randomBytes(32).toString('hex');

    if (existingUser) {
      invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${invitationToken}`;
    } else {
      tempPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const newUser = await db.user.create({
        data: {
          email,
          name: email.split('@')[0],
          password: hashedPassword,
          role: Role.MEMBER,
        },
      });

      const authToken = jwt.sign({ userId: newUser.id }, process.env.NEXTAUTH_SECRET!, {
        expiresIn: '1h',
      });

      invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${invitationToken}&auth_token=${authToken}`;
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.workspaceInvitation.upsert({
      where: { workspaceId_email: { workspaceId, email } },
      update: {
        token: invitationToken,
        expiresAt,
        invitedById: currentUserId,
        role: WorkspaceRole.MEMBER,
        temppassword: tempPassword ?? undefined,
      },
      create: {
        workspaceId,
        email,
        token: invitationToken,
        expiresAt,
        invitedById: currentUserId,
        role: WorkspaceRole.MEMBER,
        temppassword: tempPassword ?? undefined,
      },
    });

    await sendMail({
      to: email,
      subject: `You're invited to join a workspace on Project Pro`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>You've been invited to join Project Pro</h2>
          <p>You have been invited to join a workspace.</p>
          <p>Please click the button below to accept the invitation. This link will expire in 24 hours.</p>

          <p style="margin: 20px 0;">
            <a href="${invitationLink}" 
              style="display: inline-block; padding: 12px 24px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 6px;">
              Accept Invitation
            </a>
          </p>

          ${
            tempPassword
              ? `
              <div style="margin-top: 20px; padding: 12px; background-color: #f9f9f9; border: 1px solid #ccc; border-radius: 4px;">
                <p><strong>Login Credentials:</strong></p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                <p style="font-size: 0.9em; color: #555;">You can change your password after logging in.</p>
                  <p style="font-size: 0.9em; color: #555;">
            After clicking the invitation link above, use this email and password to log in and set up your account.
          </p>
              </div>
              `
              : ''
          }

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="font-size: 0.85em; word-break: break-word;">${invitationLink}</p>
        </div>
      `,
    });

    return NextResponse.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('[INVITATIONS_POST]', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
