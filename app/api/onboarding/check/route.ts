import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Checks if the current user belongs to any workspace.
 * This is used to determine if a newly signed-in user should be
 * redirected to the onboarding flow or to their first workspace.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // If there's no session or user, they don't belong to a workspace yet.
  if (!session?.user?.id) {
    return NextResponse.json({ workspaceId: null });
  }

  // Get the user ID directly from the session (more efficient).
  const userId = session.user.id;

  // --- MODIFIED LOGIC ---
  // Instead of checking for ownership, we now check for membership.
  // This correctly handles users who were invited to a workspace.
  // We find the first workspace membership record associated with the user.
  const firstMembership = await db.workspaceMember.findFirst({
    where: {
      userId: userId,
    },
    // Optional: order by when they joined to consistently get their first workspace
    orderBy: {
      joinedAt: 'asc',
    },
  });
  
  // If a membership record exists, the user is part of at least one workspace.
  if (firstMembership) {
    // Return the ID of that workspace.
    return NextResponse.json({ workspaceId: firstMembership.workspaceId });
  }
  
  // If no membership is found, the user has not created or joined any workspace yet.
  // They should be sent to the onboarding flow.
  return NextResponse.json({ workspaceId: null });
}