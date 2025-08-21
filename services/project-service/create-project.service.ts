import { db } from '@/lib/db';

export interface ProjectCreationData {
  name: string;
  workspaceId: string;
  userId: string;
  dueDate: Date;
  departmentId: string;
}

export class ProjectCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectCreationError';
  }
}

/**
 * Creates a project and assigns the creator as the project lead in a single transaction.
 * @throws {ProjectCreationError} Throws a specific error if the operation fails.
 */
export const createProjectInDb = async (projectData: ProjectCreationData) => {
  // First, check for an existing project for better UX before starting a transaction.
  const existingProject = await checkProjectNameExists({
    name: projectData.name,
    workspaceId: projectData.workspaceId,
  });

  if (existingProject) {
    throw new ProjectCreationError("Project already exists. Please search and add tasks to it.");
  }

  try {
    // Use a transaction to ensure both operations (project creation and member assignment) succeed or fail together.
    const result = await db.$transaction(async (tx) => {
      // 1. Create the project using the transaction client 'tx'
      const newProject = await tx.project.create({
        data: {
          name: projectData.name,
          workspaceId: projectData.workspaceId,
          createdBy: projectData.userId,
          dueDate: projectData.dueDate,
          departmentId: projectData.departmentId,
        },
      });

      // 2. Add the creator as a 'LEAD' member of the newly created project.
      // This assumes you have a `projectMember` model in your Prisma schema.
      await tx.projectMember.create({
        data: {
          projectId: newProject.id,
          userId: projectData.userId,
          role: 'LEAD', // Assigning the creator as the lead
        },
      });

      // 3. Return the necessary data from the transaction.
      return { project: newProject, creatorId: projectData.userId };
    });

    return result;

  } catch (error: any) {
    // Handle Prisma unique constraint error as a fallback.
    if (error.code === 'P2002') {
      throw new ProjectCreationError("Project name already exists in this workspace.");
    }

    // Log the original, technical error for debugging purposes.
    console.error("DATABASE_ERROR: Failed to execute project creation transaction.", error);

    // Throw a user-friendly error to the calling function.
    throw new ProjectCreationError("Could not save the project to the database.");
  }
};

/**
 * Checks if a project with the given name already exists in a workspace.
 * @param {object} params - The parameters for the check.
 * @param {string} params.name - The project name to check.
 * @param {string} params.workspaceId - The workspace to check within.
 * @returns {Promise<Project | null>} The existing project object if found, otherwise null.
 */
export const checkProjectNameExists = async ({ name, workspaceId }: { name: string; workspaceId: string; }) => {
  const existingProject = await db.project.findFirst({
    where: {
      name: name,
      workspaceId: workspaceId,
    },
  });

  return existingProject; // This will be the project object or null
};