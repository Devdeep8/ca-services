import { Queue } from 'bullmq';
// Define types for the data we'll be passing around.
// These should ideally come from a shared types package or be based on your Prisma schema.
interface Project {
  id: string;
  name: string;
  workspaceId: string;
  departmentId: string;
}

interface User {
  id: string;
  name: string | null;
}

const QUEUE_NAME = 'notification-queue';

// Connect to the same Redis instance your worker is listening to.
// Use environment variables for production.
const notificationQueue = new Queue(QUEUE_NAME, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
});

/**
 * Queues a 'project:created' notification job.
 * This is its only responsibility.
 * @param project - The newly created project object.
 * @param creator - The user who created the project.
 */
export const queueProjectCreatedNotification = async (project: Project, creator: User ) => {
  const jobData = {
    projectId: project.id,
    projectName: project.name,
    creatorId: creator.id,
    creatorName: creator.name || 'A new user',
    workspaceId: project.workspaceId,
    departmentId : project.departmentId
    
  };

  await notificationQueue.add('project:created', jobData, {
    removeOnComplete: true,
    attempts: 3,
  });

  console.log(`✅ Queued 'project:created' notification for project: ${project.name}`);
};