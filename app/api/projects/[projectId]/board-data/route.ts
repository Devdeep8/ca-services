import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // --- FIX: Await the params object before accessing its properties ---
    const { projectId } = await params;

    // It's good practice to ensure the projectId was resolved.
    if (!projectId) {
        return new NextResponse("Project ID is missing in request.", { status: 400 });
    }

    const projectData = await db.project.findUnique({
      where: { id: projectId },
      include: {
        // We fetch tasks directly now, not nested under columns
        tasks: {
          orderBy: { position: 'asc' },
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
          },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    if (!projectData) {
      return new NextResponse('Project not found', { status: 404 });
    }

    return NextResponse.json(projectData);
  } catch (error) {
    console.error('[BOARD_DATA_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}