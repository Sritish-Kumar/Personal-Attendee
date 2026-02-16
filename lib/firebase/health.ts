import { randomUUID } from "node:crypto";

import { getFirestoreAdmin } from "@/lib/firebase/admin";

export const firestoreHealthCheck = async () => {
  const db = getFirestoreAdmin();
  const probeId = randomUUID();
  const ref = db.collection("_healthchecks").doc(`probe-${probeId}`);

  try {
    await ref.set({
      createdAt: new Date().toISOString(),
      source: "step1-health-check"
    });

    const snapshot = await ref.get();

    return {
      ok: snapshot.exists,
      probeId
    };
  } finally {
    await ref.delete().catch(() => {
      // Best-effort cleanup to avoid stale probe docs.
    });
  }
};
