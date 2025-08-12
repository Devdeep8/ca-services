import { authorizeTaskUpdate, AuthorizationError } from '@/services/task-service/auth.service';
import { db } from '@/lib/db'; // We still import it to use the mocked version
import { ProjectRole } from '@prisma/client';
import { jest } from '@jest/globals';
// Use jest.mock() with a factory function to create an explicit mock.
// This is the most reliable way to solve the TypeError.
jest.mock('@/lib/db', () => ({
  db: {
    task: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Cast db to its mocked type for type-safety and autocompletion
const mockedDb = db as jest.Mocked<typeof db>;

describe('Authorization Service: authorizeTaskUpdate', () => {
  const userId = 'user-123';
  const tasks = [{ id: 'task-abc' }];
  const projectId = 'proj-xyz';

  beforeEach(() => {
    // Reset all mock implementations and calls before each test
    jest.resetAllMocks();
  });

  it('should allow a LEAD to update tasks in their project', async () => {
    // Arrange
    mockedDb.task.findUnique.mockResolvedValue({
      project: {
        id: projectId,
        members: [{ role: ProjectRole.LEAD }],
      },
    } as any); // Use 'as any' to simplify mock data type
    mockedDb.task.count.mockResolvedValue(0);

    // Act & Assert
    await expect(authorizeTaskUpdate(userId, tasks)).resolves.toBe(projectId);
  });

  it('should prevent a LEAD from updating tasks in a different project', async () => {
    // Arrange
    mockedDb.task.findUnique.mockResolvedValue({
      project: {
        id: projectId,
        members: [{ role: ProjectRole.LEAD }],
      },
    } as any);
    mockedDb.task.count.mockResolvedValue(1); // One task is in another project

    // Act & Assert
    await expect(authorizeTaskUpdate(userId, tasks)).rejects.toThrow(
      new AuthorizationError('Cannot modify tasks from different projects.')
    );
  });

  it('should prevent a non-LEAD from updating unassigned tasks', async () => {
    // Arrange
    mockedDb.task.findUnique.mockResolvedValue({
      project: {
        id: projectId,
        members: [{ role: ProjectRole.MEMBER }],
      },
    } as any);
    mockedDb.task.count.mockResolvedValue(1); // One task is not assigned to the user

    // Act & Assert
    await expect(authorizeTaskUpdate(userId, tasks)).rejects.toThrow(
      new AuthorizationError('You can only modify tasks assigned to you.')
    );
  });
});