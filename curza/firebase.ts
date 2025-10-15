// src/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, httpsCallable /*, connectFunctionsEmulator */ } from "firebase/functions";

// --- Firebase config from .env (Expo: EXPO_PUBLIC_* is correct) ---
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// --- Initialize once ---
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// --- Core services ---
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- Cloud Functions (match your deploy region) ---
export const functions = getFunctions(app, "us-central1");

// If you want to use emulator locally, uncomment this:
// if (__DEV__) {
//   try { connectFunctionsEmulator(functions, "127.0.0.1", 5001); } catch {}
// }

// --- Callable functions ---
// Current summarize endpoint
export const summarizeAI = httpsCallable(functions, "summarize");

// ✅ New test generator (preferred name). If your backend is still `buildQuiz`,
// keep both until you deploy the `createTest` function.
export const createTestAI = httpsCallable(functions, "createTest");

// Legacy quiz generator (kept so your screens won’t break during migration)
export const buildQuizAI = httpsCallable(functions, "buildQuiz");
