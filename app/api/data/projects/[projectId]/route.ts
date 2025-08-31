import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { Prisma, ProjectRole } from "@prisma/client";
import { ProjectStatus, Priority, ProjectType } from '@prisma/client';
import { hasUserRole } from "@/services/role-services/has-user-role.service";

/**
 * Zod schema for validating the incoming request body for PATCH requests.
 * This now matches the updated Prisma schema.
 */
const updateProjectSchema = z.object({
  // --- Scalar Fields ---
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(ProjectStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  projectType: z.nativeEnum(ProjectType).optional(), // New
  isClientProject: z.boolean().optional(), // New
  zohoFolderLink: z.string().url("Must be a valid URL").nullable().optional(), // New
  startDate: z.coerce.date().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),

  // --- Relational ID Fields ---
  createdBy: z.string().cuid("Invalid creator ID").optional(),
  departmentId: z.string().cuid("Invalid department ID").nullable().optional(),
  clientId: z.string().cuid("Invalid client ID").nullable().optional(), // New
  internalProductId: z.string().cuid("Invalid product ID").nullable().optional(), // New

  // --- Many-to-Many Relation ---
  members: z.array(
    z.object({
      userId: z.string().cuid(),
      role: z.nativeEnum(ProjectRole),
    })
  ).optional(),
})
.refine(data => {
    // If isClientProject is explicitly being set to true, a clientId must also be provided.
    if (data.isClientProject === true && data.clientId === undefined) {
      // This validation only triggers if `isClientProject` is in the payload.
      // We need to ensure we don't block unsetting a client.
      return false;
    }
    return true;
}, {
    message: "A client must be selected when marking this as a client project.",
    path: ["clientId"],
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

  const { members, createdBy, departmentId, internalProductId, ...scalarProjectData } =
    validation.data;

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
    if (
      scalarProjectData.name !== undefined &&
      scalarProjectData.name !== existingProject.name
    ) {
      updatePayload.name = scalarProjectData.name;
    }

    if (
      scalarProjectData.description !== undefined &&
      scalarProjectData.description !== existingProject.description
    ) {
      updatePayload.description = scalarProjectData.description;
    }

    if (
      scalarProjectData.status !== undefined &&
      scalarProjectData.status !== existingProject.status
    ) {
      updatePayload.status = scalarProjectData.status;
    }

    if (
      scalarProjectData.priority !== undefined &&
      scalarProjectData.priority !== existingProject.priority
    ) {
      updatePayload.priority = scalarProjectData.priority;
    }

    if (
      scalarProjectData.startDate !== undefined &&
      scalarProjectData.startDate !== existingProject.startDate
    ) {
      updatePayload.startDate = scalarProjectData.startDate;
    }

    if (
      scalarProjectData.dueDate !== undefined &&
      scalarProjectData.dueDate !== existingProject.dueDate
    ) {
      updatePayload.dueDate = scalarProjectData.dueDate;
    }

    if (createdBy && createdBy !== existingProject.createdBy) {
      updatePayload.creator = { connect: { id: createdBy } };
    }

    if (
      departmentId !== undefined &&
      departmentId !== existingProject.departmentId
    ) {
      if (departmentId === null) {
        // If the form sends null, disconnect the department
        updatePayload.department = { disconnect: true };
      } else {
        // Otherwise, connect to the new department
        updatePayload.department = { connect: { id: departmentId } };
      }
    }

    if (
      internalProductId !== undefined &&
      internalProductId !== existingProject.internalProductId
    ) {
      if (internalProductId === null) {
        // If the form sends null, disconnect the internalProduct
        updatePayload.internalProduct = { disconnect: true };
      } else {
        // Otherwise, connect to the new internalProduct
        updatePayload.internalProduct = { connect: { id: internalProductId } };
      }
    }
    if (
      scalarProjectData.zohoFolderLink !== undefined &&
      scalarProjectData.zohoFolderLink !== existingProject.zohoFolderLink
    ) {
      updatePayload.zohoFolderLink = scalarProjectData.zohoFolderLink;
    }
    if (
      scalarProjectData.projectType !== undefined &&
      scalarProjectData.projectType !== existingProject.projectType
    ) {
      updatePayload.projectType = scalarProjectData.projectType;
    }
    if (
      scalarProjectData.isClientProject !== undefined &&
      scalarProjectData.isClientProject !== existingProject.isClientProject
    ) {
      updatePayload.isClientProject = scalarProjectData.isClientProject;
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

    // if(depa)

    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error) {
    console.error("PATCH Failed:", error);
    return NextResponse.json(
      { message: "Failed to update project" },
      { status: 500 }
    );
  }
}

