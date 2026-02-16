import { getFirestoreAdmin } from "@/lib/firebase/admin";
import type { QuickNoteEntry } from "@/lib/firestore/models";
import { quickNoteSchema, type QuickNoteInput } from "@/lib/validators/notes";

const COLLECTION = "quick-notes";

export const createQuickNote = async (input: QuickNoteInput): Promise<QuickNoteEntry> => {
  const data = quickNoteSchema.parse(input);
  const db = getFirestoreAdmin();
  const ref = db.collection(COLLECTION).doc();
  const now = new Date().toISOString();

  const payload: QuickNoteEntry = {
    id: ref.id,
    content: data.content,
    createdAt: now,
    updatedAt: now
  };

  await ref.set(payload);
  return payload;
};

export const deleteQuickNote = async (noteId: string) => {
  const cleanNoteId = noteId.trim();
  if (!cleanNoteId) {
    throw new Error("Missing note id");
  }

  const db = getFirestoreAdmin();
  await db.collection(COLLECTION).doc(cleanNoteId).delete();
};

export const updateQuickNote = async (noteId: string, input: QuickNoteInput): Promise<void> => {
  const cleanNoteId = noteId.trim();
  if (!cleanNoteId) {
    throw new Error("Missing note id");
  }

  const data = quickNoteSchema.parse(input);
  const db = getFirestoreAdmin();
  const ref = db.collection(COLLECTION).doc(cleanNoteId);
  const existing = await ref.get();

  if (!existing.exists) {
    throw new Error("Note does not exist");
  }

  await ref.update({
    content: data.content,
    updatedAt: new Date().toISOString()
  });
};

export const listQuickNotes = async (limitCount = 8): Promise<QuickNoteEntry[]> => {
  const db = getFirestoreAdmin();
  const snapshot = await db
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(limitCount)
    .get();

  return snapshot.docs.map((doc) => doc.data() as QuickNoteEntry);
};
