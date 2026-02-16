import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const attendanceStatusSchema = z.enum(["present", "absent"]);

export const attendanceSchema = z.object({
  subjectId: z.string().trim().min(2).max(50),
  date: z.string().regex(datePattern, "Attendance date must be YYYY-MM-DD"),
  status: attendanceStatusSchema
});

export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;
export type AttendanceInput = z.infer<typeof attendanceSchema>;
