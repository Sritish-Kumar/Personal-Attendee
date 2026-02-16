import { getFirestoreAdmin } from "@/lib/firebase/admin";
import type { AttendanceStatus } from "@/lib/validators/attendance";
import { attendanceSchema } from "@/lib/validators/attendance";

export type AttendanceEntry = {
  subjectId: string;
  date: string;
  status: AttendanceStatus;
  updatedAt: string;
};

const COLLECTION = "attendance";

const getAttendanceDocId = (date: string, subjectId: string) => `${date}__${subjectId}`;

export const upsertAttendance = async (input: {
  subjectId: string;
  date: string;
  status: AttendanceStatus;
}) => {
  const data = attendanceSchema.parse(input);
  const db = getFirestoreAdmin();
  const ref = db.collection(COLLECTION).doc(getAttendanceDocId(data.date, data.subjectId));

  const payload: AttendanceEntry = {
    subjectId: data.subjectId,
    date: data.date,
    status: data.status,
    updatedAt: new Date().toISOString()
  };

  await ref.set(payload, { merge: true });

  return payload;
};

export const listAttendanceForDate = async (date: string): Promise<AttendanceEntry[]> => {
  const db = getFirestoreAdmin();
  const snapshot = await db.collection(COLLECTION).where("date", "==", date).get();

  return snapshot.docs
    .map((doc) => doc.data() as AttendanceEntry)
    .sort((a, b) => a.subjectId.localeCompare(b.subjectId));
};

export const listAttendanceInRange = async (
  startDate: string,
  endDate: string
): Promise<AttendanceEntry[]> => {
  const db = getFirestoreAdmin();
  const snapshot = await db
    .collection(COLLECTION)
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .get();

  return snapshot.docs.map((doc) => doc.data() as AttendanceEntry);
};

export const getAttendanceStatusMapForDate = async (date: string) => {
  const entries = await listAttendanceForDate(date);

  return entries.reduce<Record<string, AttendanceStatus>>((acc, entry) => {
    acc[entry.subjectId] = entry.status;
    return acc;
  }, {});
};

export const markSubjectsPresentForDate = async (date: string, subjectIds: string[]) => {
  const uniqueSubjectIds = Array.from(new Set(subjectIds.map((id) => id.trim()).filter(Boolean)));

  if (uniqueSubjectIds.length === 0) {
    return 0;
  }

  await Promise.all(
    uniqueSubjectIds.map((subjectId) => upsertAttendance({ subjectId, date, status: "present" }))
  );

  return uniqueSubjectIds.length;
};
