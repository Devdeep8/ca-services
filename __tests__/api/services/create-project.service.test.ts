/**
 * @jest-environment node
 */
import { db } from '@/lib/db';
import { createProjectInDb, ProjectCreationData } from '@/services/project-service/create-project.service';
import { ProjectCreationError } from '@/utils/errors';

// --- FIX: Mock the entire db dependency, including findFirst ---
jest.mock('@/lib/db', () => ({
  db: {
    project: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// --- TYPE-SAFE MOCK VARIABLES ---
const mockedTransaction = db.$transaction as jest.Mock;
const mockedProjectFindFirst = db.project.findFirst as jest.Mock;


describe('Project Service: createProjectInDb', () => {

  const baseProjectData: ProjectCreationData = {
    name: 'New Test Project',
    workspaceId: 'ws-123',
    userId: 'user-123',
    dueDate: new Date(),
    departmentId: 'dept-1',
    isClientProject: false,
    internalProductId: 'prod-abc',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Success Cases ---

  it('should create an internal project and a lead member in a transaction', async () => {
    // --- FIX: Mock the db call directly ---
    mockedProjectFindFirst.mockResolvedValue(null); // Project does not exist

    const newProject = { id: 'proj-1', ...baseProjectData };
    
    mockedTransaction.mockImplementation(async (callback) => {
        const tx = { 
            project: { create: jest.fn().mockResolvedValue(newProject) }, 
            projectMember: { create: jest.fn().mockResolvedValue({}) } 
        };
        return await callback(tx);
    });

    const result = await createProjectInDb(baseProjectData);

    // --- FIX: Assert the db call was made ---
    expect(mockedProjectFindFirst).toHaveBeenCalledWith({
        where: { name: baseProjectData.name, workspaceId: baseProjectData.workspaceId }
    });
    expect(mockedTransaction).toHaveBeenCalledTimes(1);
    expect(result.project).toEqual(newProject);
    expect(result.creatorId).toBe(baseProjectData.userId);
  });

  it('should create a client project successfully', async () => {
    mockedProjectFindFirst.mockResolvedValue(null);
    const clientProjectData = { ...baseProjectData, isClientProject: true, clientId: 'client-xyz', internalProductId: undefined };
    
    // --- FIX: Ensure the mocked return data matches the real logic (null, not undefined) ---
    const newProject = { id: 'proj-2', ...clientProjectData, internalProductId: null };

    mockedTransaction.mockImplementation(async (callback) => {
        const tx = { 
            project: { create: jest.fn().mockResolvedValue(newProject) }, 
            projectMember: { create: jest.fn().mockResolvedValue({}) } 
        };
        return await callback(tx);
    });

    const result = await createProjectInDb(clientProjectData);

    expect(result.project.clientId).toBe('client-xyz');
    expect(result.project.internalProductId).toBeNull();
  });


  // --- Validation and Business Logic Failures ---

  it('should throw a ProjectCreationError if a client project is missing a clientId', async () => {
    const invalidData = { ...baseProjectData, isClientProject: true, clientId: undefined };
    
    await expect(createProjectInDb(invalidData)).rejects.toThrow(
        "A Client ID is required when creating a project for an external client."
    );
  });
  
  it('should throw a ProjectCreationError if an internal project is missing an internalProductId', async () => {
    const invalidData = { ...baseProjectData, isClientProject: false, internalProductId: undefined };
    
    await expect(createProjectInDb(invalidData)).rejects.toThrow(
        "An Internal Product ID is required when creating an internal project."
    );
  });

  it('should throw a ProjectCreationError if the project name already exists', async () => {
    // --- FIX: Mock the db call to simulate an existing project ---
    mockedProjectFindFirst.mockResolvedValue({ id: 'existing-proj-id', name: baseProjectData.name });

    await expect(createProjectInDb(baseProjectData)).rejects.toThrow(
        "Project already exists. Please search and add tasks to it."
    );
    expect(mockedTransaction).not.toHaveBeenCalled();
  });


  // --- Database Error Failures ---

  it('should throw a ProjectCreationError on a Prisma unique constraint violation (P2002)', async () => {
    mockedProjectFindFirst.mockResolvedValue(null);
    const prismaError = { code: 'P2002' };
    mockedTransaction.mockRejectedValue(prismaError);

    await expect(createProjectInDb(baseProjectData)).rejects.toThrow(
        "Project name already exists in this workspace."
    );
  });
  
  it('should throw a generic ProjectCreationError for unexpected database errors', async () => {
    mockedProjectFindFirst.mockResolvedValue(null);
    mockedTransaction.mockRejectedValue(new Error("Database connection lost"));

    await expect(createProjectInDb(baseProjectData)).rejects.toThrow(
        "Could not save the project due to an unexpected error."
    );
  });
});