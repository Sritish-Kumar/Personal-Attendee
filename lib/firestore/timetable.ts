import { getFirestoreAdmin } from "@/lib/firebase/admin";
import { getWeekdayFromDate, isWeekday, type Weekday } from "@/lib/constants/weekdays";
import { timetableSchema, timetableUpdateSchema, type TimetableInput, type TimetableUpdateInput } from "@/lib/validators/timetable";
import type { TimetableEntry } from "@/lib/firestore/models";

const COLLECTION = "timetable";
export type TimetableClassForDate = {
  subjectId: string;
  subjectName: string;
  day: Weekday;
  startTime: string;
  endTime: string;
};

export const createTimetableEntry = async (input: TimetableInput) => {
  const data = timetableSchema.parse(input);
  const db = getFirestoreAdmin();
  const ref = db.collection(COLLECTION).doc(data.subjectId);

  const existing = await ref.get();
  if (existing.exists) {
    throw new Error(`Subject '${data.subjectId}' already exists`);
  }

  const now = new Date().toISOString();
  const payload: TimetableEntry = {
    ...data,
    createdAt: now,
    updatedAt: now
  };

  await ref.set(payload);

  return payload;
};

export const updateTimetableEntry = async (subjectId: string, input: TimetableUpdateInput) => {
  const cleanSubjectId = subjectId.trim();
  const data = timetableUpdateSchema.parse(input);
  const db = getFirestoreAdmin();
  const ref = db.collection(COLLECTION).doc(cleanSubjectId);

  const existing = await ref.get();
  if (!existing.exists) {
    throw new Error(`Subject '${cleanSubjectId}' does not exist`);
  }

  const payload = {
    ...data,
    updatedAt: new Date().toISOString()
  };

  await ref.update(payload);

  return payload;
};

export const deleteTimetableEntry = async (subjectId: string) => {
  const cleanSubjectId = subjectId.trim();
  const db = getFirestoreAdmin();
  const ref = db.collection(COLLECTION).doc(cleanSubjectId);

  await ref.delete();
};

export const listTimetableEntries = async (): Promise<TimetableEntry[]> => {
  const db = getFirestoreAdmin();
  const snapshot = await db.collection(COLLECTION).get();

  return snapshot.docs
    .map((doc) => doc.data() as TimetableEntry)
    .sort((a, b) => {
      if (a.subjectName === b.subjectName) {
        return a.subjectId.localeCompare(b.subjectId);
      }
      return a.subjectName.localeCompare(b.subjectName);
    });
};

export const listTimetableByWeekday = async (weekday: Weekday): Promise<TimetableClassForDate[]> => {
  if (!isWeekday(weekday)) {
    throw new Error(`Invalid weekday: ${weekday}`);
  }

  const entries = await listTimetableEntries();
  return entries
    .flatMap((entry) => {
      const session = entry.sessions.find((item) => item.day === weekday);
      if (!session) {
        return [];
      }

      return [
        {
          subjectId: entry.subjectId,
          subjectName: entry.subjectName,
          day: weekday,
          startTime: session.startTime,
          endTime: session.endTime
        }
      ];
    })
    .sort((a, b) => {
      if (a.startTime === b.startTime) {
        return a.subjectName.localeCompare(b.subjectName);
      }
      return a.startTime.localeCompare(b.startTime);
    });
};

export const listTimetableForDate = async (date: string): Promise<TimetableClassForDate[]> => {
  const weekday = getWeekdayFromDate(date);
  return listTimetableByWeekday(weekday);
};
