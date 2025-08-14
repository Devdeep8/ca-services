import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params:Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;

    // 1. Fetch confirmed members
    const members = await db.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true , department: true },
        },
      },
    });

    // 2. Fetch pending invitations
    const invitations = await db.workspaceInvitation.findMany({
      where: {
        workspaceId,
        accepted: false,

      },
    });

    // 3. Combine and format the data for the frontend
    const formattedMembers = members.map(m => ({
        type: 'member',
        id: m.userId,
        email: m.user.email,
        name: m.user.name,
        avatar: m.user.avatar,
        role: m.role,
        status: 'Active',
        joined: m.joinedAt,
        department: m.user.department?.name || null
    }));

    const formattedInvitations = invitations.map(i => ({
        type: 'invitation',
        id: i.id,
        email: i.email,
        name: null,
        avatar: null,
        role: i.role,
        status: 'Pending',
        joined: i.createdAt,
        department: null
    }));

    const combinedList = [...formattedMembers, ...formattedInvitations];

    return NextResponse.json(combinedList);

  } catch (error) {
    console.error('[MEMBERS_GET]', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}