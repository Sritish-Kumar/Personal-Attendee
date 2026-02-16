import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const semesterConfigSchema = z
  .object({
    semesterStart: z.string().regex(datePattern, "Semester start must be YYYY-MM-DD"),
    semesterEnd: z.string().regex(datePattern, "Semester end must be YYYY-MM-DD"),
    minAttendance: z.coerce.number().int().min(1).max(100)
  })
  .superRefine((value, ctx) => {
    if (value.semesterStart > value.semesterEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Semester end date must be on or after semester start date",
        path: ["semesterEnd"]
      });
    }
  });

export type SemesterConfigInput = z.infer<typeof semesterConfigSchema>;
