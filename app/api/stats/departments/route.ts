// app/api/stats/departments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
// IMPORTANT: Remember to add your session/auth checks here for security.
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    // SECURITY: Add session validation and workspace membership check here.
    // const session = await getServerSession(authOptions);
    // if (!session) { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
        return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    try {
        // 1. Fetch departments, including their projects and the tasks within those projects.
        const departmentsWithTasks = await db.department.findMany({
            include: {
                project: {
                    where: { workspaceId },
                    include: {
                        // Go one level deeper to get all tasks for each project
                        tasks: {
                            select: {
                                status: true,
                                dueDate: true,
                            }
                        }
                    }
                }
            }
        });

        // 2. Process the data to calculate task-based statistics for each department.
        const results = departmentsWithTasks.map(dept => {
            // Use flatMap to create a single array of all tasks from all projects in this department
            const allTasks = dept.project.flatMap(p => p.tasks);

            const totalTasks = allTasks.length;
            const completedTasks = allTasks.filter(task => task.status === 'DONE').length;
            const overdueTasks = allTasks.filter(task => 
                task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
            ).length;
            
            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            // 3. Return the data with the new attribute names you requested.
            return {
                id: dept.id,
                name: dept.name,
                totalTasks: totalTasks,
                completedTasks: completedTasks,
                overdueTasks: overdueTasks,
                completionRate: completionRate,
            };
        }).sort((a, b) => b.totalTasks - a.totalTasks); // Sort by most projects

        return NextResponse.json(results);

    } catch (error) {
        console.error("Failed to fetch department task stats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}