// src/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth/react-native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable /*, connectFunctionsEmulator */ } from 'firebase/functions';

// --- Firebase config ---
const firebaseConfig = {
  apiKey: 'AIzaSyDbQCczVN9NP1XPtWjb6u1aeOjrlIVZIvY',
  authDomain: 'curza-d607e.firebaseapp.com',
  projectId: 'curza-d607e',
  storageBucket: 'curza-d607e.firebasestorage.app',
  messagingSenderId: '1052480298705',
  appId: '1:1052480298705:web:947cf2267208bda8e32ff0',
  measurementId: 'G-WL3RX44BEP',
};

// --- Initialize once ---
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// --- Auth (RN persistence on native, standard on web) ---
let _auth: Auth;
if (Platform.OS === 'web') {
  _auth = getAuth(app);
} else {
  // guard against double-init during Fast Refresh
  try {
    _auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    _auth = getAuth(app);
  }
}
export const auth = _auth;

// --- Core services ---
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- Cloud Functions ---
export const functions = getFunctions(app, 'us-central1');
// if (__DEV__) {
//   try { connectFunctionsEmulator(functions, '127.0.0.1', 5001); } catch {}
// }

// --- Callable functions ---
export const summarizeAI  = httpsCallable(functions, 'summarize');
export const createTestAI = httpsCallable(functions, 'createTest');
