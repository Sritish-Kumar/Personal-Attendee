"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getTodayDateString } from "@/lib/date/date";
import { upsertAttendance, markSubjectsPresentForDate } from "@/lib/firestore/attendance";
import { requireAuthenticatedUser } from "@/lib/firestore/auth-guard";
import { isHoliday } from "@/lib/firestore/holidays";
import { createQuickNote, deleteQuickNote, updateQuickNote } from "@/lib/firestore/notes";
import { listTimetableForDate } from "@/lib/firestore/timetable";
import { attendanceStatusSchema } from "@/lib/validators/attendance";

const DASHBOARD_PATH = "/dashboard";

const isNextRedirect = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    ("digest" in error && String((error as { digest?: string }).digest).includes("NEXT_REDIRECT"))
  );
};

const redirectWithState = (status: "success" | "error", message: string) => {
  const params = new URLSearchParams({
    status,
    message
  });
  redirect(`${DASHBOARD_PATH}?${params.toString()}`);
};

export const markSingleAttendanceAction = async (formData: FormData) => {
  try {
    await requireAuthenticatedUser();

    const date = String(formData.get("date") ?? getTodayDateString());
    const subjectId = String(formData.get("subjectId") ?? "").trim();
    const status = attendanceStatusSchema.parse(formData.get("status"));

    if (!subjectId) {
      throw new Error("Missing subject id");
    }

    const [holiday, scheduled] = await Promise.all([
      isHoliday(date),
      listTimetableForDate(date)
    ]);

    if (holiday) {
      throw new Error("Cannot mark attendance on a holiday");
    }

    const hasSubjectScheduled = scheduled.some((entry) => entry.subjectId === subjectId);

    if (!hasSubjectScheduled) {
      throw new Error("Subject is not scheduled for this date");
    }

    await upsertAttendance({
      subjectId,
      date,
      status
    });

    revalidatePath(DASHBOARD_PATH);
    redirectWithState("success", `Marked ${subjectId} as ${status}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to save attendance";
    redirectWithState("error", message);
  }
};

export const markAllTodayPresentAction = async () => {
  try {
    await requireAuthenticatedUser();

    const date = getTodayDateString();

    if (await isHoliday(date)) {
      throw new Error("Today is configured as a holiday");
    }

    const todayClasses = await listTimetableForDate(date);

    if (todayClasses.length === 0) {
      throw new Error("No classes scheduled today");
    }

    const count = await markSubjectsPresentForDate(
      date,
      todayClasses.map((entry) => entry.subjectId)
    );

    revalidatePath(DASHBOARD_PATH);
    redirectWithState("success", `Marked ${count} class(es) present for today`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to mark all present";
    redirectWithState("error", message);
  }
};

export const createQuickNoteAction = async (formData: FormData) => {
  try {
    await requireAuthenticatedUser();

    const content = String(formData.get("content") ?? "");
    await createQuickNote({ content });

    revalidatePath(DASHBOARD_PATH);
    redirectWithState("success", "Note added");
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to add note";
    redirectWithState("error", message);
  }
};

export const deleteQuickNoteAction = async (formData: FormData) => {
  try {
    await requireAuthenticatedUser();

    const noteId = String(formData.get("noteId") ?? "");
    await deleteQuickNote(noteId);

    revalidatePath(DASHBOARD_PATH);
    redirectWithState("success", "Note deleted");
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to delete note";
    redirectWithState("error", message);
  }
};

export const updateQuickNoteAction = async (formData: FormData) => {
  try {
    await requireAuthenticatedUser();

    const noteId = String(formData.get("noteId") ?? "");
    const content = String(formData.get("content") ?? "");
    await updateQuickNote(noteId, { content });

    revalidatePath(DASHBOARD_PATH);
    redirectWithState("success", "Note updated");
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to update note";
    redirectWithState("error", message);
  }
};
