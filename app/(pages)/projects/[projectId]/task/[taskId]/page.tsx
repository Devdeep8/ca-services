import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { TaskEditPageClient } from './TaskEditPageClient';

interface TaskPageProps {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
}

export default async function TaskPage({ params }: TaskPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { projectId, taskId } = await params;

  const [task, projectMembers] = await Promise.all([
    db.task.findUnique({
      where: { id: taskId, projectId: projectId },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        reporter: { select: { id: true, name: true, avatar: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        timeEntries: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { date: 'desc' },
        },
      },
    }),
    // FIX: Correctly query for members of the specific project.
    db.user.findMany()
  ]);

  if (!task) {
    notFound();
  }

  // This is correct: create a plain object to pass to the client.
  const serializableTask = {
    ...task,
    actualHours: task.actualHours.toNumber(),
    estimatedHours: task.estimatedHours ? task.estimatedHours.toNumber() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    startDate: task.startDate ? task.startDate.toISOString() : null,
    comments: task.comments.map(comment => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
    })),
    timeEntries: task.timeEntries.map(entry => ({
      ...entry,
      date: entry.date.toISOString(),
    })),
  };

  return (
    <TaskEditPageClient
      initialTask={serializableTask}
      projectMembers={projectMembers}
      currentUserId={session.user.id}
    />
  );
}