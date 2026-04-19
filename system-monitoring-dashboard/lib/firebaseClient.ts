import { initializeApp, type FirebaseApp } from "firebase/app";

let app: FirebaseApp | null = null;

export function getFirebaseApp() {
  if (app) return app;

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  if (!config.apiKey || !config.projectId || !config.appId) {
    throw new Error("Missing Firebase public config");
  }

  app = initializeApp(config);
  return app;
}

export function isFirebaseMode() {
  return process.env.NEXT_PUBLIC_DATA_SOURCE === "firebase";
}
