// @/app/projects/[projectId]/notes/_components/notes-editor.tsx

"use client";

import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { useTheme } from "next-themes";
import { useDebouncedCallback } from "use-debounce";
import { updateProjectNotes } from "@/actions/update-notes"; // Adjust path

// NEW: Import the ShadCN-specific BlockNote components
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";

// NEW: Import the ShadCN-specific styles and a font.
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

interface NotesEditorProps {
  projectId: string;
  initialContent?: PartialBlock[]; // The notes data from the database
}

export function NotesEditor({ projectId, initialContent }: NotesEditorProps) {
  // The useTheme hook is no longer needed for the editor's theme prop,
  // but you might still need it for other parts of your app.
  // const { resolvedTheme } = useTheme();

  const handleSave = useDebouncedCallback(async (editor: BlockNoteEditor) => {
    const contentAsJson = editor.document;
    await updateProjectNotes(projectId, contentAsJson);
  }, 2000);

  // NEW: Creates a new editor instance using useCreateBlockNote.
  const editor = useCreateBlockNote({
    initialContent,
  });

  return (
    <div className="mt-4 relative">
      {/* NEW: Use the BlockNoteView from @blocknote/shadcn */}
      <BlockNoteView
        editor={editor}
        onChange={() => handleSave(editor)}
        // The `theme` prop is no longer needed!
        // The editor will automatically match your ShadCN theme.
        className="min-h-[400px]"
      />
    </div>
  );
}