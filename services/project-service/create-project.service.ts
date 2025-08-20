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
 * Creates a project record in the database.
 * @throws {ProjectCreationError} Throws a specific error if the database operation fails.
 */
export const createProjectInDb = async (projectData: ProjectCreationData) => {
  // First check for existing project (better UX)
  const existingProject = await checkProjectNameExists({ 
    name: projectData.name, 
    workspaceId: projectData.workspaceId 
  });
  
  if (existingProject) {
    throw new ProjectCreationError("Project already exists ,Please Search and Add Task .");
  }
    
  try {
    const newProject = await db.project.create({
      data: {
        name: projectData.name,
        workspaceId: projectData.workspaceId,
        createdBy: projectData.userId,
        dueDate: projectData.dueDate,
        departmentId: projectData.departmentId,
      },
    });
    return { project: newProject, creatorId: projectData.userId };

  } catch (error: any) {
    // Handle Prisma unique constraint error as fallback
    if (error.code === 'P2002') {
      throw new ProjectCreationError("Project name already exists in this workspace.");
    }
    
    // Log the original, technical error for debugging
    console.error("DATABASE_ERROR: Failed to create project.", error);
    
    // Throw your new, specific error to the calling function
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