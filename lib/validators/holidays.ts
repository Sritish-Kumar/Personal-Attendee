import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const holidaySchema = z.object({
  date: z.string().regex(datePattern, "Holiday date must be YYYY-MM-DD"),
  reason: z.string().trim().min(2, "Reason must be at least 2 characters").max(200)
});

export type HolidayInput = z.infer<typeof holidaySchema>;
