/**
 * @jest-environment node
 */
import { PATCH } from '@/app/api/data/projects/[projectId]/route';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';
import { ProjectStatus, Priority, ProjectRole } from '@prisma/client';

// --- MOCKS ---
jest.mock('@/lib/db', () => ({
  db: {
    project: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    projectMember: {
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

// --- TYPE ASSERTIONS FOR MOCKS ---
const mockedProjectFindUnique = db.project.findUnique as jest.Mock;
const mockedProjectUpdate = db.project.update as jest.Mock;
const mockedProjectMemberDeleteMany = db.projectMember.deleteMany as jest.Mock;
const mockedProjectMemberUpsert = db.projectMember.upsert as jest.Mock;


describe('PATCH /api/data/projects/[projectId]', () => {
    
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ✅ Use CUID-like strings for all IDs to pass Zod validation
  const mockProjectId = 'clwqcac2a0000356v9j4d5m3i';
  const mockExistingProject = {
    id: mockProjectId,
    name: 'Original Name',
    description: 'Original description',
    status: ProjectStatus.ACTIVE,
    priority: Priority.MEDIUM,
    departmentId: 'clwqcac2a0001356v6q7g8h2k', // Old department ID
    workspaceId: 'clwqcac2a0002356v4n5b7f9d',
    createdBy: 'clwqcac2a0003356v1a2b3c4d',
    members: [
        { userId: 'clwqcac2a0004356vdeadbeef', role: ProjectRole.MEMBER }, // user-A
        { userId: 'clwqcac2a0005356vbeefdead', role: ProjectRole.MEMBER }, // user-B
    ]
  };

  const createMockRequest = (body: object) => {
    return new NextRequest(`http://localhost/api/data/projects/${mockProjectId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  };

  const mockParams = {
      params: Promise.resolve({ projectId: mockProjectId })
  };

  // --- FAILURE SCENARIOS ---
  it('should return 404 Not Found if the project does not exist', async () => {
    mockedProjectFindUnique.mockResolvedValue(null); // Simulate project not found
    const req = createMockRequest({ name: 'New Name' });
    const response = await PATCH(req, mockParams);
    expect(response.status).toBe(404);
  });

  it('should return 400 Bad Request for invalid input data (Zod validation)', async () => {
    const req = createMockRequest({ name: 'A' }); // Invalid: name is too short
    const response = await PATCH(req, mockParams);
    expect(response.status).toBe(400);
  });

  // --- SUCCESS SCENARIOS ---
  it('should successfully assign a new department', async () => {
    mockedProjectFindUnique.mockResolvedValue(mockExistingProject);
    mockedProjectUpdate.mockResolvedValue({});
    
    const newDepartmentId = 'clwqcac2a0006356v12345678'; 
    const req = createMockRequest({ departmentId: newDepartmentId });
    await PATCH(req, mockParams);

    expect(mockedProjectUpdate).toHaveBeenCalledWith({
      where: { id: mockProjectId },
      data: {
        department: { connect: { id: newDepartmentId } },
      },
    });
  });

  it('should successfully update project members (add, remove, and update role)', async () => {
    mockedProjectFindUnique.mockResolvedValue(mockExistingProject);
    mockedProjectUpdate.mockResolvedValue({}); 

    const newMembersPayload = [
        { userId: 'clwqcac2a0005356vbeefdead', role: ProjectRole.LEAD },   // Update user-B's role
        { userId: 'clwqcac2a0007356v98765432', role: ProjectRole.MEMBER }, // Add user-C
    ];

    const req = createMockRequest({ members: newMembersPayload });
    await PATCH(req, mockParams);

    // Assert: Check that user-A was deleted
    expect(mockedProjectMemberDeleteMany).toHaveBeenCalledWith({
      where: {
        projectId: mockProjectId,
        userId: { in: ['clwqcac2a0004356vdeadbeef'] }, 
      },
    });
    
    // Assert: Check that the updated and new members were upserted
    expect(mockedProjectMemberUpsert).toHaveBeenCalledTimes(2);

    expect(mockedProjectMemberUpsert).toHaveBeenCalledWith({
      where: { projectId_userId: { projectId: mockProjectId, userId: 'clwqcac2a0005356vbeefdead' } },
      update: { role: ProjectRole.LEAD },
      create: { projectId: mockProjectId, userId: 'clwqcac2a0005356vbeefdead', role: ProjectRole.LEAD },
    });
    
    expect(mockedProjectMemberUpsert).toHaveBeenCalledWith({
      where: { projectId_userId: { projectId: mockProjectId, userId: 'clwqcac2a0007356v98765432' } },
      update: { role: ProjectRole.MEMBER },
      create: { projectId: mockProjectId, userId: 'clwqcac2a0007356v98765432', role: ProjectRole.MEMBER },
    });
  });
});