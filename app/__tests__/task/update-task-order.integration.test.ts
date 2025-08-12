import { POST } from '@/app/api/tasks/update-order/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { ProjectRole, TaskStatus, User, Project, Task, Workspace } from '@prisma/client';

// We ONLY mock the external dependency: next-auth
jest.mock('next-auth');
const mockGetServerSession = getServerSession as jest.Mock;

describe('API Integration Test: POST /api/tasks/update-order', () => {

  afterAll(async () => {
    await db.$disconnect();
  });

  it('should succeed when a LEAD user updates a task', async () => {
    // These variables will hold the records we create
    let workspace: Workspace | null = null;
    let leadUser: User | null = null;
    let project: Project | null = null;
    let task: Task | null = null;

    try {
      // Arrange: Create all necessary data in the correct order

      // 1. CREATE THE USER FIRST
      leadUser = await db.user.create({ 
        data: { email: 'lead-safe@example.com', name: 'Lead User' } 
      });

      // 2. CREATE THE WORKSPACE, CONNECTING IT TO THE USER 🔗
      workspace = await db.workspace.create({
        data: {
          name: 'Test Workspace',
          owner: {
            connect: { id: leadUser.id } // Connect to the user we just created
          }
        }
      });

      // 3. Create the Project using the new workspace's ID
      project = await db.project.create({ 
        data: { 
          name: 'Lead Project Safe', 
          createdBy: leadUser.id, 
          workspaceId: workspace.id 
        } 
      });
      
      await db.projectMember.create({ 
        data: { projectId: project.id, userId: leadUser.id, role: ProjectRole.LEAD } 
      });

      task = await db.task.create({ 
        data: { 
          title: 'Task for Lead Safe', 
          position: 0, 
          status: TaskStatus.TODO, 
          projectId: project.id, 
          reporterId: leadUser.id 
        } 
      });

      mockGetServerSession.mockResolvedValue({ user: leadUser });

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          tasks: [{ id: task.id, position: 1, status: TaskStatus.DONE }],
        }),
      });

      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(200);

      const updatedTask = await db.task.findUnique({ where: { id: task.id } });
      expect(updatedTask?.status).toBe(TaskStatus.DONE);

    } finally {
      // Cleanup: Delete records in the reverse order of creation
      if (task) await db.task.deleteMany({ where: { id: task.id } });
      if (project) await db.projectMember.deleteMany({ where: { projectId: project.id } });
      if (project) await db.project.delete({ where: { id: project.id } });
      if (workspace) await db.workspace.delete({ where: { id: workspace.id } });
      if (leadUser) await db.user.delete({ where: { id: leadUser.id } });
    }
  });
});