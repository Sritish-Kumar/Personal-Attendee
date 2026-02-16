import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { getServerEnv } from "@/lib/config/env";

const serverEnv = getServerEnv();

export const getFirebaseAdminApp = () => {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    credential: cert({
      projectId: serverEnv.FIREBASE_PROJECT_ID,
      clientEmail: serverEnv.FIREBASE_CLIENT_EMAIL,
      privateKey: serverEnv.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
  });
};

export const getFirestoreAdmin = () => getFirestore(getFirebaseAdminApp());
