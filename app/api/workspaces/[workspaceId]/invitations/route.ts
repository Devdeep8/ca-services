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
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const currentUserId = session.user.id;
    const { workspaceId } = await params;
    const { email } = await request.json();

    if (!email) {
      return new NextResponse(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    const existingMember = await db.workspaceMember.findFirst({
      where: { workspaceId, user: { email } },
    });

    if (existingMember) {
      return new NextResponse(JSON.stringify({ error: 'This user is already a member.' }), { status: 409 });
    }
    
    const workspace = await db.workspace.findUnique({ where: { id: workspaceId }});
    if (!workspace) {
      return new NextResponse(JSON.stringify({ error: 'Workspace not found.' }), { status: 404 });
    }

    let userToInvite = await db.user.findUnique({ where: { email } });

    // --- Refactored Core Logic ---
    let randomPassword ;
    // Step A: If the user does not exist, create them first.
    if (!userToInvite) {
      // Use a non-guessable placeholder password. The user will be prompted to set a real one.
       randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      userToInvite = await db.user.create({
        data: {
          email,
          name: email.split('@')[0],
          password: hashedPassword,
          role: Role.MEMBER,
        },
      });
    }

    // Step B: Now that we are GUARANTEED to have a user object, ALWAYS generate a magic link.
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const authToken = jwt.sign({ userId: userToInvite.id }, process.env.NEXTAUTH_SECRET!, {
      expiresIn: '24h', // The magic login is valid for 24 hours
    });

    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${invitationToken}&auth_token=${authToken}`;
    
    // Step C: Create or update the invitation record in the database.
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await db.workspaceInvitation.upsert({
        where: { workspaceId_email: { workspaceId, email } },
        update: { token: invitationToken, expiresAt },
        create: {
            workspaceId,
            email,
            token: invitationToken,
            expiresAt,
            invitedById: currentUserId,
            role: WorkspaceRole.MEMBER,
            temppassword: randomPassword
        },
    });

    // Step D: Send the universal magic link email.
    // SECURITY: We no longer send a temporary password, as the magic link handles authentication.
    await sendMail({
        to: email,
        subject: `You're invited to join ${workspace.name} on Project Pro`,
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>You've been invited to join ${workspace.name}</h2>
            <p>Click the button below to accept the invitation. This link will automatically sign you in and is valid for 24 hours.</p>
            <p style="margin: 20px 0;">
            <a href="${invitationLink}" 
                style="display: inline-block; padding: 12px 24px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 6px;">
                Accept Invitation & Sign In
            </a>
            </p>
        </div>
        `,
    });

    return NextResponse.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('[INVITATIONS_POST]', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}