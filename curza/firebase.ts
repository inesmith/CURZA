// curza/src/firebase.ts
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
  storageBucket: "curza-d607e.appspot.com",
  messagingSenderId: "1052480298705",
  appId: "1:1052480298705:web:947cf2267208bda8e32ff0",
  measurementId: "G-WL3RX44BEP"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth (RN vs Web)
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

// DB & Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

// Functions (region must match your deployed functions: us-central1)
const functions = getFunctions(app, 'us-central1');

// --- Callables ---
export const generateTestAI = httpsCallable(functions, 'generateTestAI');

export const summariseAI   = httpsCallable(functions, 'summarise');
export const scoreTestAI   = httpsCallable(functions, 'scoreTest');
export const createTestAI  = httpsCallable(functions, 'buildTest');
export const listOptionsAI = httpsCallable(functions, 'listOptionsAI');
export const keyConcepts   = httpsCallable(functions, 'keyConcepts');

// --- Typed helpers for AI lists ---
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
