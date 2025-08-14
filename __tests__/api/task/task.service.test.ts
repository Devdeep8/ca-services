import { updateTaskOrder } from '@/services/task-service/task.service';
import { db } from '@/lib/db';
import { TaskStatus } from '@prisma/client';

// The mock setup is correct.
jest.mock('@/lib/db', () => ({
  db: {
    $transaction: jest.fn(),
  },
}));

// We remove the 'mockedDb' cast here too.

describe('Task Service: updateTaskOrder', () => {
  beforeEach(() => {
    (db.$transaction as jest.Mock).mockClear();
  });

  it('should call task.update for each task within a transaction', async () => {
    const tasksToUpdate = [
      { id: 'task-1', position: 1, status: TaskStatus.IN_PROGRESS },
      { id: 'task-2', position: 2, status: TaskStatus.DONE },
    ];

    // This is our mock transaction client that the service's callback will receive
    const mockTx = { task: { update: jest.fn() } };

    // ✨ FIX: Cast the specific method as a jest.Mock.
    (db.$transaction as jest.Mock).mockImplementation(async (callback: (tx: any) => Promise<any>) => {
      // Execute the callback passed from the service, giving it our mock transaction client
      return callback(mockTx);
    });

    await updateTaskOrder(tasksToUpdate);

    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.task.update).toHaveBeenCalledTimes(2);
    expect(mockTx.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { position: 1, status: TaskStatus.IN_PROGRESS },
    });
    expect(mockTx.task.update).toHaveBeenCalledWith({
        where: { id: 'task-2' },
        data: { position: 2, status: TaskStatus.DONE },
    });
  });
});