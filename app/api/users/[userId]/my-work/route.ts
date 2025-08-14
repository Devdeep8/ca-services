import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TaskStatus, ProjectRole } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    // 1. Fetch the user's details and their role in every project they are a member of.
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        projectMemberships: {
          select: {
            projectId: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Create a simple lookup map for the user's role in each project for quick access.
    const projectRoles = new Map(
      user.projectMemberships.map((mem) => [mem.projectId, mem.role])
    );

    // 2. Fetch all potentially relevant tasks assigned to this user.
    const allAssignedTasks = await db.task.findMany({
      where: {
        assigneeId: userId,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW] },
      },
      include: {
        project: {
          select: { id: true, name: true, isClient: true, departmentId: true },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // 3. Filter and categorize tasks based on your specified priority rules.
    const clientProjectTasks = [];
    const myDepartmentTasks = [];
    const otherTasks = [];

    for (const task of allAssignedTasks) {
      const userRoleInProject = projectRoles.get(task.project.id);
      if (!userRoleInProject) continue;

      // Apply role-based status filtering.
      if (userRoleInProject === ProjectRole.MEMBER && task.status === TaskStatus.REVIEW) {
        continue; // Members don't see "In Review" tasks in their work list.
      }
      
      // Categorize the task.
      if (task.project.isClient) {
        clientProjectTasks.push(task);
      } else if (task.project.departmentId && task.project.departmentId === user.departmentId) {
        myDepartmentTasks.push(task);
      } else {
        otherTasks.push(task);
      }
    }

    // 4. Return the fully prepared data structure.
    return NextResponse.json({
      user: {
        name: user.name,
        avatar: user.avatar,
      },
      clientProjectTasks,
      myDepartmentTasks,
      otherTasks,
    });

  } catch (error) {
    console.error("[MY_WORK_API_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}