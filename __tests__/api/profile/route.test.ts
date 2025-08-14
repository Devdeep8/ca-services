import { GET } from '@/app/api/profile/route';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// Mock the dependencies
jest.mock('next-auth');
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const mockedGetServerSession = getServerSession as jest.Mock;
const mockedDbUserFindUnique = db.user.findUnique as jest.Mock;

describe('API Route: /api/profile', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 Unauthorized if no session exists', async () => {
    mockedGetServerSession.mockResolvedValue(null);

    // GET function doesn't expect any arguments
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('should return the user profile for an authenticated user', async () => {
    const mockSession = { user: { id: 'user-123' } };
    const mockUserProfile = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      departmentId: 'dept-abc',
    };

    mockedGetServerSession.mockResolvedValue(mockSession);
    mockedDbUserFindUnique.mockResolvedValue(mockUserProfile);

    // GET function doesn't expect any arguments
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockUserProfile);
    expect(mockedDbUserFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      select: {
        id: true,
        name: true,
        email: true,
        departmentId: true,
      },
    });
  });
});