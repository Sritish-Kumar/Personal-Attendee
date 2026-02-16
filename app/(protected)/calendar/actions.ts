"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getTodayDateString } from "@/lib/date/date";
import { upsertAttendance } from "@/lib/firestore/attendance";
import { requireAuthenticatedUser } from "@/lib/firestore/auth-guard";
import { isHoliday } from "@/lib/firestore/holidays";
import { listTimetableForDate } from "@/lib/firestore/timetable";
import { attendanceStatusSchema } from "@/lib/validators/attendance";

const CALENDAR_PATH = "/calendar";

const isNextRedirect = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).includes("NEXT_REDIRECT")
  );
};

const redirectWithState = (month: string, status: "success" | "error", message: string) => {
  const params = new URLSearchParams({
    month,
    status,
    message
  });
  redirect(`${CALENDAR_PATH}?${params.toString()}`);
};

export const updateCalendarAttendanceAction = async (formData: FormData) => {
  const month = String(formData.get("month") ?? "").trim() || getTodayDateString().slice(0, 7);

  try {
    await requireAuthenticatedUser();

    const date = String(formData.get("date") ?? "").trim();
    const subjectId = String(formData.get("subjectId") ?? "").trim();
    const status = attendanceStatusSchema.parse(formData.get("status"));

    if (!date || !subjectId) {
      throw new Error("Missing date or subject id");
    }

    if (date > getTodayDateString()) {
      throw new Error("Cannot mark attendance for future dates");
    }

    if (await isHoliday(date)) {
      throw new Error("Cannot mark attendance on a holiday");
    }

    const scheduledSubjects = await listTimetableForDate(date);
    const isScheduled = scheduledSubjects.some((item) => item.subjectId === subjectId);

    if (!isScheduled) {
      throw new Error("Subject is not scheduled on selected date");
    }

    await upsertAttendance({ date, subjectId, status });

    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    redirectWithState(month, "success", `Updated ${subjectId} on ${date} to ${status}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Failed to update attendance";
    redirectWithState(month, "error", message);
  }
};
