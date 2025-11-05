import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, type Auth } from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';

// --- Firebase config ---
const firebaseConfig = { 
  apiKey: "AIzaSyDbQCczVN9NP1XPtWjb6u1aeOjrlIVZIvY",
  authDomain: "curza-d607e.firebaseapp.com",
  projectId: "curza-d607e",
  storageBucket: "curza-d607e.firebasestorage.app",
  messagingSenderId: "1052480298705",
  appId: "1:1052480298705:web:947cf2267208bda8e32ff0",
  measurementId: "G-WL3RX44BEP"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let _auth: Auth;
if (Platform.OS === 'web') {
  _auth = getAuth(app);
} else {
  try {
    _auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    _auth = getAuth(app);
  }
}
export const auth = _auth;

export const db = getFirestore(app);
export const storage = getStorage(app);

// region must match your deployed functions list (us-central1)
export const functions = getFunctions(app, 'us-central1');

// Keep client API in “test” terms
export const summariseAI  = httpsCallable(functions, 'summarise');
export const scoreTestAI  = httpsCallable(functions, 'scoreTest');  // simple stub added on server
export const createTestAI = httpsCallable(functions, 'buildTest');
export const listOptionsAI = httpsCallable(functions, 'listOptionsAI');
export const keyConcepts = httpsCallable(functions, 'keyConcepts');

// --- 🔹 New: Typed helpers for AI lists ---
type ListCtx = { curriculum: string; grade: string | number; subject: string };
type TopicsResp = { topics?: string[] };
type PapersResp = { papers?: string[] };

export async function getTopicListAI(params: ListCtx) {
  const callable = httpsCallable<ListCtx & { type: 'topics' }, TopicsResp>(
    functions,
    'listOptionsAI'
  );
  return callable({ ...params, type: 'topics' });
}

export async function getPaperListAI(params: ListCtx) {
  const callable = httpsCallable<ListCtx & { type: 'papers' }, PapersResp>(
    functions,
    'listOptionsAI'
  );
  return callable({ ...params, type: 'papers' });
}
