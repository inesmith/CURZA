// src/services/authService.ts
import { auth, db } from "../../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }

  // Send verification email right after account creation (non-blocking)
  try {
    await sendEmailVerification(cred.user);
  } catch {
    // ignore email failures silently
  }

  await setDoc(
    doc(db, "users", cred.user.uid),
    {
      uid: cred.user.uid,
      email,
      displayName: displayName ?? null,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return cred.user;
}

// Original export
export function signInWithEmailPassword(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

// ✅ Alias to match existing imports elsewhere (e.g., LoginScreen)
export function signInWithEmail(email: string, password: string) {
  return signInWithEmailPassword(email, password);
}

export function signOutUser() {
  return signOut(auth);
}

// Observe auth changes (use in your root/screens)
export function observeAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// --- Optional helpers for your UI ---
export async function resendVerificationEmail() {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}
