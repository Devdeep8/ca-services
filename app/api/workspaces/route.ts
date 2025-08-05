import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ workspaces: [], currentWorkspace: null }, { status: 200 });
  }

  // Get user
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ workspaces: [], currentWorkspace: null }, { status: 200 });
  }

  // Get all workspaces where user is a member
  const memberships = await db.workspaceMember.findMany({
    where: { userId: user.id },
    include: { workspace: true },
  });
  const workspaces = memberships.map(m => ({ id: m.workspace.id, name: m.workspace.name }));

  // Optionally, add owned workspaces not in memberships (if schema allows)
  // const owned = await db.workspace.findMany({ where: { ownerId: user.id } });
  // ...merge with workspaces if needed

  // Pick the first workspace as current (or you can use a cookie/localStorage in the future)
  const currentWorkspace = workspaces[0] || null;

  return NextResponse.json({ workspaces, currentWorkspace }, { status: 200 });
}