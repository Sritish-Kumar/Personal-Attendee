import { z } from "zod";

import { WEEKDAYS } from "@/lib/constants/weekdays";

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
const weekdayEnum = z.enum(WEEKDAYS);

const sessionSchema = z
  .object({
    day: weekdayEnum,
    startTime: z.string().regex(timePattern, "Start time must be in HH:MM format"),
    endTime: z.string().regex(timePattern, "End time must be in HH:MM format")
  })
  .superRefine((value, ctx) => {
    if (value.startTime >= value.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start time must be earlier than end time",
        path: ["startTime"]
      });
    }
  });

const timetableBaseSchema = z.object({
  subjectId: z
    .string()
    .trim()
    .min(2, "Subject ID must be at least 2 characters")
    .max(50, "Subject ID must be at most 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Subject ID must only contain letters, numbers, _ or -"),
  subjectName: z.string().trim().min(2, "Subject name must be at least 2 characters").max(120),
  sessions: z.array(sessionSchema).min(1, "Add at least one day/time session")
});

const validateTimetable = <T extends { sessions: { day: string }[] }>(value: T, ctx: z.RefinementCtx) => {
  const uniqueDays = new Set(value.sessions.map((session) => session.day));
  if (uniqueDays.size !== value.sessions.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A subject can only have one time slot per weekday",
      path: ["sessions"]
    });
  }
};

export const timetableSchema = timetableBaseSchema.superRefine(validateTimetable);
export const timetableUpdateSchema = timetableBaseSchema
  .omit({ subjectId: true })
  .superRefine(validateTimetable);

export type TimetableInput = z.infer<typeof timetableSchema>;
export type TimetableUpdateInput = z.infer<typeof timetableUpdateSchema>;
