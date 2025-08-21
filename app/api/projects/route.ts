import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { getUserByEmail } from "@/utils/helper-server-function";
import { createProjectSchema } from "@/lib/validations";
import {
  createProjectInDb,
  ProjectCreationData,
} from "@/services/project-service/create-project.service";
import { ProjectCreationError } from "@/utils/errors";
// import { queueProjectCreatedNotification } from "@/services/notification-service/notification.service";
/**
 * Fetches all projects for a given workspace, correctly identifying the project lead.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // 1. Validate session
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userData = await getUserByEmail(session.user.email);
  const userId = userData.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 2. Get workspaceId from query params
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json(
      { error: "Workspace ID is required" },
      { status: 400 }
    );
  }

  try {
    // 3. Ensure the user is a member of the workspace
    const member = await db.workspaceMember.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: userId,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Fetch projects
    const projectsFromDb = await db.project.findMany({
      where: {
        workspaceId: workspaceId,
      },
      include: {
        // Include the user who created the project
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        // ✅ FIX: Specifically include ONLY the member with the 'LEAD' role
        members: {
          where: {
            role: "LEAD", // This filter is the key to the solution
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 5. Process the data to create a consistent 'lead' field for the frontend
    const projects = projectsFromDb.map((p) => {
      // This logic is now reliable because `p.members` will only contain the lead (or be empty)
      const lead = p.members.length > 0 ? p.members[0].user : p.creator;

      // We no longer need the 'members' array on the final project object
      const { members, ...projectData } = p;

      return { ...projectData, lead };
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
// --- POST /api/projects ---
// Creates a new project with default values.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userData = await getUserByEmail(session.user.email);
  const userId = userData.user?.id;

  if (!userId || !userData.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  try {
    const body = await req.json();
    // --- 2. PARSE THE FULL PAYLOAD ---
    const { name, workspaceId, departmentId , isClientProject, clientId , internalProductId } = createProjectSchema.parse(body);

    // Basic validation: if it's a client project, a client ID must be provided.
    // if (isClient && !clientId) {
    //     return NextResponse.json({ error: "clientId is required for client projects" }, { status: 400 });
    // }

    // Calculate due date as one month from now
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1);

    const projectData = {
      name: name,
      workspaceId: workspaceId,
      departmentId: departmentId,
      userId: userId,
      dueDate: dueDate,
      isClientProject: isClientProject ,
      clientId: isClientProject? clientId:null ,
      internalProductId: internalProductId ? internalProductId :null,
    };

    const projectCeation = await createProjectInDb(
      projectData as ProjectCreationData
    );


    // await queueProjectCreatedNotification(projectCeation.project , userData.user!);

    return NextResponse.json(
      { project: projectCeation.project, creator: projectCeation.creatorId },
      { status: 201 }
    );
  } catch (error : any) {
   if (error instanceof z.ZodError) {
      // This line is crucial for returning a real array
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    if (error.name === 'ProjectCreationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    // console.error("Failed to create project:", error);
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
