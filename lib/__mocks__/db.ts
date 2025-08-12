import { jest } from '@jest/globals';

const db = {
  task: {
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  projectMember: {
    findMany: jest.fn(),
  },
  // The notification mock has been removed
  $transaction: jest.fn(),
};

export default db;