import { z } from "zod";

export const quickNoteSchema = z.object({
  content: z.string().trim().min(1, "Note cannot be empty").max(240, "Note must be 240 characters or less")
});

export type QuickNoteInput = z.infer<typeof quickNoteSchema>;
