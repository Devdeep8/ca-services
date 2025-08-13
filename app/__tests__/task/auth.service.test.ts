import { authorizeProjectMember, AuthorizationError } from '@/services/task-service/auth.service';
import { db } from '@/lib/db';
import { ProjectRole } from '@prisma/client';
import { jest } from '@jest/globals';

// ✨ FIX 1: Mock the 'projectMember' model, which is what the function actually uses.
jest.mock('@/lib/db', () => ({
  db: {
    projectMember: {
      findUnique: jest.fn(),
    },
  },
}));

// Cast db to its mocked type for type-safety
const mockedDb = db as jest.Mocked<typeof db>;

describe('Authorization Service: authorizeProjectMember', () => {
  const userId = 'user-123';
  const projectId = 'proj-xyz';

  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
  });

  // ✨ FIX 2: A relevant test case for the function's success path.
  it("should return the user's role if they are a project member", async () => {
    // Arrange: Mock the database to return a member with a 'LEAD' role.
    mockedDb.projectMember.findUnique.mockResolvedValue({
      id: 'member-id',
      userId: userId,
      projectId: projectId,
      role: ProjectRole.LEAD,
      assignedAt: new Date(),
    });

    // Act & Assert: Expect the function to resolve and return the correct role.
    await expect(authorizeProjectMember(userId, projectId)).resolves.toBe(ProjectRole.LEAD);
  });

  // ✨ FIX 3: A relevant test case for the function's failure path.
  it('should throw an AuthorizationError if the user is not a project member', async () => {
    // Arrange: Mock the database to find no member (returns null).
    mockedDb.projectMember.findUnique.mockResolvedValue(null);

    // Act & Assert: Expect the function to reject with the specific error.
    await expect(authorizeProjectMember(userId, projectId)).rejects.toThrow(
      new AuthorizationError('You are not a member of this project.')
    );
  });
});