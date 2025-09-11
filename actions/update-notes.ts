// @/actions/update-notes.ts

"use server";

import { db } from "@/lib/db"; // Adjust this path to your db instance
import { revalidatePath } from "next/cache";

// Type for BlockNote's JSON output
type BlockNoteDocument = any[]; // Or a more specific type if you have it

export async function updateProjectNotes(
  projectId: string,
  notes: BlockNoteDocument
) {
  try {
    await db.project.update({
      where: { id: projectId },
      data: { notes: notes },
    });
  } catch (error) {
    console.error("Failed to update notes:", error);
    throw new Error("Could not save notes.");
  }

  // Revalidate the path to ensure the page shows the latest data
  revalidatePath(`/projects/${projectId}/notes`);
}