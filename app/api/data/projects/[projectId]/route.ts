// app/api/projects/[projectId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { Prisma, ProjectRole } from "@prisma/client";

/**
 * Zod schema for validating the incoming request body for PATCH requests.
 * This now matches the updated Prisma schema.
 */
const updateProjectSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  startDate: z.coerce.date().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  createdBy: z.string().cuid("Invalid creator ID").optional(),
  members: z
    .array(
      z.object({
        userId: z.string().cuid(),
        role: z.nativeEnum(ProjectRole),
      })
    )
    .optional(),
});

/**
 * Handles GET requests to fetch a single project by its ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        // ✅ FIX: Removed 'image: true' because it doesn't exist on your User model
        creator: { select: { id: true, name: true } },
        members: {
          include: {
            // ✅ FIX: Removed 'image: true' here as well
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(project);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { message: "Error fetching project" },
      { status: 500 }
    );
  }
}

/**
 * Handles PATCH requests to update a project and its members.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const body = await request.json();

  const validation = updateProjectSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Invalid input",
        errors: validation.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { members, createdBy, ...scalarProjectData } = validation.data;

  try {
    // Fetch current project to compare and only update changed fields
    const existingProject = await db.project.findUnique({
      where: { id: projectId },
      include: { members: { select: { userId: true, role: true } } },
    });

    if (!existingProject) {
      return NextResponse.json(
        { message: `Project with ID ${projectId} not found.` },
        { status: 404 }
      );
    }

    // Build update payload only with changed scalar fields
    const updatePayload: Prisma.ProjectUpdateInput = {};

    // Handle each field individually to ensure proper typing
    if (scalarProjectData.name !== undefined && scalarProjectData.name !== existingProject.name) {
      updatePayload.name = scalarProjectData.name;
    }

    if (scalarProjectData.description !== undefined && scalarProjectData.description !== existingProject.description) {
      updatePayload.description = scalarProjectData.description;
    }

    if (scalarProjectData.status !== undefined && scalarProjectData.status !== existingProject.status) {
      updatePayload.status = scalarProjectData.status;
    }

    if (scalarProjectData.priority !== undefined && scalarProjectData.priority !== existingProject.priority) {
      updatePayload.priority = scalarProjectData.priority;
    }

    if (scalarProjectData.startDate !== undefined && scalarProjectData.startDate !== existingProject.startDate) {
      updatePayload.startDate = scalarProjectData.startDate;
    }

    if (scalarProjectData.dueDate !== undefined && scalarProjectData.dueDate !== existingProject.dueDate) {
      updatePayload.dueDate = scalarProjectData.dueDate;
    }

    if (createdBy && createdBy !== existingProject.createdBy) {
      updatePayload.creator = { connect: { id: createdBy } };
    }

    // Update the project (no members yet)
    const updatedProject = await db.project.update({
      where: { id: projectId },
      data: updatePayload,
    });

    // Handle members separately to avoid long transaction timeouts
    if (members) {
      const currentMemberIds = existingProject.members.map((m) => m.userId);
      const newMemberIds = members.map((m) => m.userId);

      // Delete members no longer present
      const membersToDelete = currentMemberIds.filter(
        (id) => !newMemberIds.includes(id)
      );
      if (membersToDelete.length > 0) {
        await db.projectMember.deleteMany({
          where: { projectId, userId: { in: membersToDelete } },
        });
      }

      // Upsert only changed/added members
      const memberChanges = members.filter((m) => {
        const existing = existingProject.members.find(
          (em) => em.userId === m.userId
        );
        return !existing || existing.role !== m.role;
      });

      if (memberChanges.length > 0) {
        await Promise.all(
          memberChanges.map((member) =>
            db.projectMember.upsert({
              where: { projectId_userId: { projectId, userId: member.userId } },
              update: { role: member.role },
              create: { projectId, userId: member.userId, role: member.role },
            })
          )
        );
      }
    }

    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error) {
    console.error("PATCH Failed:", error);
    return NextResponse.json(
      { message: "Failed to update project" },
      { status: 500 }
    );
  }
}
