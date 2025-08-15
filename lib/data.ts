// lib/data.ts
import { notFound } from 'next/navigation';
import { db } from './db';
export async function getProjectForEdit(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      department: true,
      members: {
        include: { user: true },
      },
    },
  });

  if (!project) {
    notFound(); // Triggers the 404 page if project doesn't exist
  }
  return project;
}

export async function getAllUsers() {
  return await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}


export async function getAllDepartments() {
  return await db.department.findMany({
    select: {
      id: true,
      name: true,
    },
  });
}