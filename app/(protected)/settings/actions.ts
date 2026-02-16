"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { WEEKDAYS, isWeekday } from "@/lib/constants/weekdays";
import { requireAuthenticatedUser } from "@/lib/firestore/auth-guard";
import {
  createTimetableEntry,
  deleteTimetableEntry,
  updateTimetableEntry
} from "@/lib/firestore/timetable";
import { createHoliday, deleteHoliday, updateHoliday } from "@/lib/firestore/holidays";
import { upsertSemesterConfig } from "@/lib/firestore/semester-config";

const SETTINGS_PATH = "/settings";

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
  redirect(`${SETTINGS_PATH}?${params.toString()}`);
};

const parseSessions = (formData: FormData) => {
  const rawDays = formData.getAll("days").map((value) => String(value));
  const uniqueDays = Array.from(new Set(rawDays));

  const invalidDays = uniqueDays.filter((day) => !isWeekday(day));
  if (invalidDays.length > 0) {
    throw new Error(`Invalid weekdays: ${invalidDays.join(", ")}`);
  }

  const weekdays = uniqueDays.filter((day): day is (typeof WEEKDAYS)[number] => isWeekday(day));

  return weekdays.map((day) => {
    const startTime = String(formData.get(`startTime_${day}`) ?? "").trim();
    const endTime = String(formData.get(`endTime_${day}`) ?? "").trim();

    if (!startTime || !endTime) {
      throw new Error(`Start and end time are required for ${day}`);
    }

    return {
      day,
      startTime,
      endTime
    };
  });
};

export const createTimetableAction = async (formData: FormData) => {
  try {
    await requireAuthenticatedUser();

    await createTimetableEntry({
      subjectId: String(formData.get("subjectId") ?? ""),
      subjectName: String(formData.get("subjectName") ?? ""),
      sessions: parseSessions(formData)
    });

    revalidatePath(SETTINGS_PATH);
    redirectWithState("success", "Timetable entry created");
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to create timetable entry";
    redirectWithState("error", message);
  }
};

export const updateTimetableAction = async (formData: FormData) => {
  try {
    await requireAuthenticatedUser();

    const subjectId = String(formData.get("subjectId") ?? "");

    await updateTimetableEntry(subjectId, {
      subjectName: String(formData.get("subjectName") ?? ""),
      sessions: parseSessions(formData)
    });

    revalidatePath(SETTINGS_PATH);
    redirectWithState("success", `Updated '${subjectId}'`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to update timetable entry";
    redirectWithState("error", message);
  }
};

export const deleteTimetableAction = async (formData: FormData) => {
  try {
    await requireAuthenticatedUser();

    const subjectId = String(formData.get("subjectId") ?? "");
    await deleteTimetableEntry(subjectId);

    revalidatePath(SETTINGS_PATH);
    redirectWithState("success", `Deleted '${subjectId}'`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to delete timetable entry";
    redirectWithState("error", message);
  }
};

export const upsertSemesterConfigAction = async (formData: FormData) => {
  try {
    await requireAuthenticatedUser();

    await upsertSemesterConfig({
      semesterStart: String(formData.get("semesterStart") ?? ""),
      semesterEnd: String(formData.get("semesterEnd") ?? ""),
      minAttendance: Number(formData.get("minAttendance") ?? "")
    });

    revalidatePath(SETTINGS_PATH);
    redirectWithState("success", "Semester config saved");
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to save semester config";
    redirectWithState("error", message);
  }
};

export const createHolidayAction = async (formData: FormData) => {
  try {
    await requireAuthenticatedUser();

    await createHoliday({
      date: String(formData.get("date") ?? ""),
      reason: String(formData.get("reason") ?? "")
    });

    revalidatePath(SETTINGS_PATH);
    redirectWithState("success", "Holiday created");
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to create holiday";
    redirectWithState("error", message);
  }
};

export const updateHolidayAction = async (formData: FormData) => {
  try {
    await requireAuthenticatedUser();

    const oldDate = String(formData.get("oldDate") ?? "");

    await updateHoliday(oldDate, {
      date: String(formData.get("date") ?? ""),
      reason: String(formData.get("reason") ?? "")
    });

    revalidatePath(SETTINGS_PATH);
    redirectWithState("success", "Holiday updated");
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to update holiday";
    redirectWithState("error", message);
  }
};

export const deleteHolidayAction = async (formData: FormData) => {
  try {
    await requireAuthenticatedUser();

    const date = String(formData.get("date") ?? "");
    await deleteHoliday(date);

    revalidatePath(SETTINGS_PATH);
    redirectWithState("success", "Holiday deleted");
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to delete holiday";
    redirectWithState("error", message);
  }
};
