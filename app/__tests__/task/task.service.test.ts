import { updateTaskOrder } from '@/services/task-service/task.service';
import { db } from '@/lib/db'; // This import will be intercepted by Jest
import { TaskStatus } from '@prisma/client';
import { jest } from '@jest/globals';

// 1. Explicitly mock the db module and define its structure.
jest.mock('@/lib/db', () => ({
  db: {
    $transaction: jest.fn(),
  },
}));

// 2. Cast the imported (and now mocked) db for type-safety
const mockedDb = db as jest.Mocked<typeof db>;

describe('Task Service: updateTaskOrder', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should call task.update for each task within a transaction', async () => {
    // Arrange
    const tasksToUpdate = [
      { id: 'task-1', position: 1, status: TaskStatus.IN_PROGRESS },
      { id: 'task-2', position: 2, status: TaskStatus.DONE },
    ];

    const mockTx = { task: { update: jest.fn() } };

    // 3. THE FIX: Type the 'callback' argument as 'any'.
    // This resolves the complex type mismatch error.
    mockedDb.$transaction.mockImplementation(async (callback: any) => {
      // Execute the callback passed from the service, giving it our mock transaction client
      return callback(mockTx);
    });

    // Act
    await updateTaskOrder(tasksToUpdate);

    // Assert
    expect(mockedDb.$transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.task.update).toHaveBeenCalledTimes(2);
    expect(mockTx.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { position: 1, status: TaskStatus.IN_PROGRESS },
    });
  });
});