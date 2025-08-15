/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/projects/route';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

// --- MOCKS ---
// Mock all external dependencies used by the API route.

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    project: {
      create: jest.fn(),
      findMany: jest.fn(), // For GET handler
    },
    workspace: {
      findUnique: jest.fn(),
    },
    workspaceMember: {
      findFirst: jest.fn(), // For GET handler to check membership
    },
  },
}));

jest.mock('@/utils/helper-server-function', () => ({
  getUserByEmail: jest.fn(),
}));


// --- TYPE-SAFE MOCK VARIABLES ---
const mockedGetSession = require('next-auth/next').getServerSession as jest.Mock;
const mockedGetUser = require('@/utils/helper-server-function').getUserByEmail as jest.Mock;

// POST mocks
const mockedProjectCreate = db.project.create as jest.Mock;
const mockedWorkspaceFindUnique = db.workspace.findUnique as jest.Mock;

// GET mocks
const mockedProjectFindMany = db.project.findMany as jest.Mock;
const mockedWorkspaceMemberFind = db.workspaceMember.findFirst as jest.Mock;


// --- TEST SUITE ---
describe('/api/projects', () => {

  // Reset all mocks before each individual test to ensure a clean state.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Tests for the GET Handler ---
  describe('GET', () => {
    const mockUser = { user: { id: 'user-123', email: 'test@example.com' } };
    const mockWorkspaceId = 'ws-abc';

    it('should return 401 Unauthorized if no session is found', async () => {
      mockedGetSession.mockResolvedValue(null);
      const req = new NextRequest(`http://localhost/api/projects?workspaceId=${mockWorkspaceId}`);
      const response = await GET(req);
      expect(response.status).toBe(401);
    });

    it('should return 400 Bad Request if workspaceId is missing', async () => {
      mockedGetSession.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockedGetUser.mockResolvedValue(mockUser);
      const req = new NextRequest('http://localhost/api/projects'); // No workspaceId
      const response = await GET(req);
      expect(response.status).toBe(400);
    });

    it('should return 403 Forbidden if the user is not a member of the workspace', async () => {
      mockedGetSession.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockedGetUser.mockResolvedValue(mockUser);
      mockedWorkspaceMemberFind.mockResolvedValue(null); // Simulate not being a member

      const req = new NextRequest(`http://localhost/api/projects?workspaceId=${mockWorkspaceId}`);
      const response = await GET(req);

      expect(response.status).toBe(403);
    });

    it('should return projects and correctly assign the lead from members', async () => {
      // Arrange
      mockedGetSession.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockedGetUser.mockResolvedValue(mockUser);
      mockedWorkspaceMemberFind.mockResolvedValue({ id: 'member-123' }); // Is a member

      const creator = { id: 'user-creator', name: 'Creator', avatar: null };
      const leadUser = { id: 'user-lead', name: 'Lead User', avatar: null };
      
      const mockProjectsFromDb = [
        {
          id: 'proj-1',
          name: 'Project with a Lead',
          creator: creator,
          members: [
            { role: 'LEAD', user: leadUser }
          ]
        },
      ];
      mockedProjectFindMany.mockResolvedValue(mockProjectsFromDb);

      // Act
      const req = new NextRequest(`http://localhost/api/projects?workspaceId=${mockWorkspaceId}`);
      const response = await GET(req);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.projects).toHaveLength(1);
      expect(body.projects[0].lead).toEqual(leadUser); // The lead should be the member with the LEAD role
      expect(body.projects[0].members).toBeUndefined(); // 'members' field should be removed
    });

    it('should return projects and correctly assign the lead from the creator if no lead member exists', async () => {
      // Arrange
      mockedGetSession.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockedGetUser.mockResolvedValue(mockUser);
      mockedWorkspaceMemberFind.mockResolvedValue({ id: 'member-123' });

      const creator = { id: 'user-creator', name: 'Creator', avatar: null };

      const mockProjectsFromDb = [
        {
          id: 'proj-2',
          name: 'Project with no Lead',
          creator: creator,
          members: [], // No member has the LEAD role
        },
      ];
      mockedProjectFindMany.mockResolvedValue(mockProjectsFromDb);

      // Act
      const req = new NextRequest(`http://localhost/api/projects?workspaceId=${mockWorkspaceId}`);
      const response = await GET(req);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.projects).toHaveLength(1);
      expect(body.projects[0].lead).toEqual(creator); // The lead should fall back to the creator
      expect(body.projects[0].members).toBeUndefined();
    });
  });


  // --- Tests for the POST Handler ---
  describe('POST', () => {
    it('should return 401 Unauthorized if no session is found', async () => {
      mockedGetSession.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/projects', { method: 'POST' });
      const response = await POST(req);
      expect(response.status).toBe(401);
    });

    it('should create a standard project successfully', async () => {
      // Arrange
      mockedGetSession.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockedGetUser.mockResolvedValue({ user: { id: 'user-123' } });

      const projectData = { name: 'New Project', workspaceId: 'ws-123' };
      const createdProject = { id: 'proj-1', ...projectData };
      mockedProjectCreate.mockResolvedValue(createdProject);

      const req = new NextRequest('http://localhost/api/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
      });

      // Act
      const response = await POST(req);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(body.project).toEqual(createdProject);
      expect(mockedProjectCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Project',
            createdBy: 'user-123',
            members: {
              create: {
                userId: 'user-123',
                role: 'LEAD',
              },
            },
          }),
        })
      );
    });

    it('should return 400 if project name is missing', async () => {
      mockedGetSession.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockedGetUser.mockResolvedValue({ user: { id: 'user-123' } });
      
      const projectData = { workspaceId: 'ws-123' }; // Missing 'name'

      const req = new NextRequest('http://localhost/api/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
      expect(mockedProjectCreate).not.toHaveBeenCalled();
    });
  });
});