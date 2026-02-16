import { getFirestoreAdmin } from "@/lib/firebase/admin";
import { semesterConfigSchema, type SemesterConfigInput } from "@/lib/validators/semester-config";
import type { SemesterConfig } from "@/lib/firestore/models";

const COLLECTION = "semesterConfig";
const DOC_ID = "current";

export const upsertSemesterConfig = async (input: SemesterConfigInput) => {
  const data = semesterConfigSchema.parse(input);
  const db = getFirestoreAdmin();
  const ref = db.collection(COLLECTION).doc(DOC_ID);

  const payload: SemesterConfig = {
    ...data,
    updatedAt: new Date().toISOString()
  };

  await ref.set(payload, { merge: true });

  return payload;
};

export const getSemesterConfig = async (): Promise<SemesterConfig | null> => {
  const db = getFirestoreAdmin();
  const snapshot = await db.collection(COLLECTION).doc(DOC_ID).get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as SemesterConfig;
};
