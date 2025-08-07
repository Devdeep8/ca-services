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
  { params }: { params:Promise<{ workspaceId: string }> }
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

    // Permission checks (uncomment and adjust as needed)
    // const member = await db.workspaceMember.findFirst({ where: { workspaceId, userId: currentUserId } });
    // if (!member || ![WorkspaceRole.OWNER, WorkspaceRole.ADMIN].includes(member.role)) {
    //   return new NextResponse(JSON.stringify({ error: 'Permission denied' }), { status: 403 });
    // }

    const existingMember = await db.workspaceMember.findFirst({ where: { workspaceId, user: { email } } });
    if (existingMember) {
      return new NextResponse(JSON.stringify({ error: 'This user is already a member.' }), { status: 409 });
    }
    
    // --- START OF NEW LOGIC ---
    let invitationLink: string;
    const existingUser = await db.user.findUnique({ where: { email } });
    const invitationToken = crypto.randomBytes(32).toString('hex');

    if (existingUser) {
      // FLOW FOR EXISTING USER: Standard invitation link
      invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${invitationToken}`;
    } else {
      // FLOW FOR NEW USER: Create user and generate a magic link
      const tempPassword = crypto.randomBytes(16).toString('hex');
      console.log(tempPassword , email , "get the pssword for now")
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
        expiresIn: '1h', // Magic link is valid for 1 hour
      });

      invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${invitationToken}&auth_token=${authToken}`;
    }
    // --- END OF NEW LOGIC ---

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Invitation valid for 24 hours
    await db.workspaceInvitation.upsert({
        where: { workspaceId_email: { workspaceId, email } },
        update: { token: invitationToken, expiresAt, invitedById: currentUserId, role: WorkspaceRole.MEMBER },
        create: {
            workspaceId,
            email,
            token: invitationToken,
            expiresAt,
            invitedById: currentUserId,
            role: WorkspaceRole.MEMBER,
        },
    });

    console.log(invitationLink)

    await sendMail({
        to: email,
        subject: `You're invited to join a workspace on Project Pro`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2>Invitation to Project Pro</h2>
              <p>You have been invited to join a workspace.</p>
              <p>Please click the button below to accept the invitation. This link will expire in 24 hours.</p>
              <p style="margin: 20px 0;">
                  <a href="${invitationLink}" 
                     style="display: inline-block; padding: 12px 24px; color: white; background-color: #0d6efd; text-decoration: none; border-radius: 6px; font-weight: bold;">
                     Accept Invitation
                  </a>
              </p>
              <hr style="border: none; border-top: 1px solid #eee;">
              <p style="margin-top: 24px; font-size: 0.9em; color: #6c757d;">
                  If the button above doesn't work, you can copy and paste the following link into your web browser:
              </p>
              <p style="font-size: 0.8em; color: #343a40; word-break: break-all;">
                  ${invitationLink}
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