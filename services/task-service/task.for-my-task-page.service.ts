// lib/services/task.service.ts

import { db } from '@/lib/db'; // Your Prisma client instance

/**
 * Fetches all necessary data for the task creation form context.
 * This includes projects the user is a member of (with their columns and members)
 * and the full details of the current user.
 * @param userId - The ID of the currently authenticated user.
 */
export async function getTaskFormContextData(userId: string ): Promise<{
  projects: any;
  currentUser: any;
}> {
  // Fetch user and their projects concurrently for performance
  const  userProjects = await  db.project.findMany({
      // Find projects where the current user is listed as a member
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      // Include the specific related data needed by the frontend
      select: {
        id: true,
        name: true,

        members: {
          select: {
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    })
  // The Prisma query returns data in the exact shape needed,
  // so minimal transformation is required. We just cast it to our frontend type
  // for type safety, assuming the selected fields match the `Project` type.
  const projects = userProjects

  const currentUser = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return {
    projects: projects,
    currentUser
  };
}