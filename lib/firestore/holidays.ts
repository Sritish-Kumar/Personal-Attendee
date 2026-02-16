import { getFirestoreAdmin } from "@/lib/firebase/admin";
import { holidaySchema, type HolidayInput } from "@/lib/validators/holidays";
import type { HolidayEntry } from "@/lib/firestore/models";

const COLLECTION = "holidays";

export const createHoliday = async (input: HolidayInput) => {
  const data = holidaySchema.parse(input);
  const db = getFirestoreAdmin();
  const ref = db.collection(COLLECTION).doc(data.date);

  const existing = await ref.get();
  if (existing.exists) {
    throw new Error(`Holiday for '${data.date}' already exists`);
  }

  const now = new Date().toISOString();
  const payload: HolidayEntry = {
    ...data,
    createdAt: now,
    updatedAt: now
  };

  await ref.set(payload);

  return payload;
};

export const updateHoliday = async (oldDate: string, input: HolidayInput) => {
  const cleanOldDate = oldDate.trim();
  const data = holidaySchema.parse(input);
  const db = getFirestoreAdmin();

  if (cleanOldDate === data.date) {
    const ref = db.collection(COLLECTION).doc(cleanOldDate);
    const existing = await ref.get();

    if (!existing.exists) {
      throw new Error(`Holiday '${cleanOldDate}' does not exist`);
    }

    await ref.update({
      reason: data.reason,
      updatedAt: new Date().toISOString()
    });

    return;
  }

  const oldRef = db.collection(COLLECTION).doc(cleanOldDate);
  const newRef = db.collection(COLLECTION).doc(data.date);

  const [oldDoc, newDoc] = await Promise.all([oldRef.get(), newRef.get()]);

  if (!oldDoc.exists) {
    throw new Error(`Holiday '${cleanOldDate}' does not exist`);
  }

  if (newDoc.exists) {
    throw new Error(`Holiday for '${data.date}' already exists`);
  }

  const now = new Date().toISOString();

  const batch = db.batch();
  batch.set(newRef, {
    date: data.date,
    reason: data.reason,
    createdAt: (oldDoc.data() as HolidayEntry).createdAt ?? now,
    updatedAt: now
  });
  batch.delete(oldRef);
  await batch.commit();
};

export const deleteHoliday = async (date: string) => {
  const db = getFirestoreAdmin();
  await db.collection(COLLECTION).doc(date.trim()).delete();
};

export const listHolidays = async (): Promise<HolidayEntry[]> => {
  const db = getFirestoreAdmin();
  const snapshot = await db.collection(COLLECTION).orderBy("date", "asc").get();

  return snapshot.docs.map((doc) => doc.data() as HolidayEntry);
};

export const isHoliday = async (date: string): Promise<boolean> => {
  const db = getFirestoreAdmin();
  const doc = await db.collection(COLLECTION).doc(date).get();
  return doc.exists;
};

export const listHolidaysInRange = async (startDate: string, endDate: string): Promise<HolidayEntry[]> => {
  const db = getFirestoreAdmin();
  const snapshot = await db
    .collection(COLLECTION)
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .orderBy("date", "asc")
    .get();

  return snapshot.docs.map((doc) => doc.data() as HolidayEntry);
};
