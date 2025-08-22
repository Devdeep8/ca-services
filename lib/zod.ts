// /lib/validators/task.ts

import { z } from 'zod';
import { Priority, TaskStatus } from '@/types'; // Use your actual path

export const taskFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  projectId: z.string({ message: "Please select a project." }).nonempty("Please select a project."),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  reporterId: z.string({ message: "A reporter must be selected." }).nonempty("A reporter must be selected."),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO), 
  estimatedHours: z.coerce
    .number({ message: "Must be a number." })
    .min(0, "Hours cannot be negative.")
    .optional(),
  // --- FIX: Use z.coerce.date() to handle string inputs ---
  startDate: z.coerce.date().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
}).refine((data) => {
    // This comparison now works correctly because the values have been coerced into Date objects.
    if (data.startDate && data.dueDate) {
      return data.dueDate >= data.startDate;
    }
    return true;
  }, {
    message: "Due date cannot be before the start date.",
    path: ["dueDate"],
});

// Output type (after parsing/defaults)
export type TaskFormData = z.infer<typeof taskFormSchema>;
// Input type (what RHF receives before parsing/coercion/defaults)
export type TaskFormInput = z.input<typeof taskFormSchema>;