import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

import { getClientEnv } from "@/lib/config/env";

const clientEnv = getClientEnv();

export const getFirebaseClientApp = () => {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    apiKey: clientEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: clientEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: clientEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: clientEnv.NEXT_PUBLIC_FIREBASE_APP_ID
  });
};

export const getFirestoreClient = () => getFirestore(getFirebaseClientApp());
