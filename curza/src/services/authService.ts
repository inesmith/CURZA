// src/services/authService.ts
import { auth, db } from "../../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(cred.user, { displayName });
  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    email,
    displayName: displayName ?? null,
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

export function signInWithEmailPassword(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signOutUser() {
  return signOut(auth);
}

export function observeAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
