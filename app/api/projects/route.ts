import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { getUserByEmail } from "@/utils/helper-server-function";
import { error } from "console";
// Fetches all projects for a given workspace.
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
  
    // 1. Validate session
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userData = await getUserByEmail(session?.user?.email as string);
    const userId = userData.user?.id
  
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
  
      // 4. Fetch projects and include related creator and members with the 'OWNER' role
      const projectsFromDb = await db.project.findMany({
        where: {
          workspaceId: workspaceId,
        },
        include: {
            
          // Include the user who created the project
          creator: {
            select: {
              name: true,
              avatar: true,
            },
          },
          // Include members who are designated as owners to identify the lead
          members: {
            select: {
              user: {
                select: {
                  name: true,
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
        // The lead is the first member with the 'OWNER' role, or the creator as a fallback.
        const lead = p.members.length > 0 ? p.members[0].user : p.creator;
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
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userData = await getUserByEmail(session.user.email as string)

  if(userData.error != null){
    return NextResponse.json({error: error} , {status: 405})
  }


  const createProjectSchema = z.object({
    name: z.string().min(1, "Project name is required."),
    workspaceId: z.string(),
  });

  try {
    const body = await req.json();
    const { name, workspaceId } = createProjectSchema.parse(body);

    // Calculate due date as one month from now
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1);

    const newProject = await db.project.create({
      data: {
        name,
        workspaceId,
        createdBy: userData.user.id,
        dueDate,
        // Add the creator as the first member of the project
        members: {
          create: {
            userId: userData.user.id,
            role: "LEAD",
          },
        },
      },
    });

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error }, { status: 400 });
    }
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
