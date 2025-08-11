import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {db} from "@/lib/db"; // your prisma client instance

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  try {
    // Try deleting the task
    const deletedTask = await db.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json(
      { message: "Task deleted successfully", task: deletedTask },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE Task Failed:", error);

    // Handle "Record not found" error
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: `Delete failed: Task with ID ${taskId} not found.` },
        { status: 404 }
      );
    }

    // Generic error
    return NextResponse.json(
      { message: "Failed to delete task" },
      { status: 500 }
    );
  }
}
