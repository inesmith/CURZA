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
  reload,
  User,
  Unsubscribe,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * Create account and immediately send a verification email.
 * Also seeds a basic user doc (merge-safe).
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }

  // Fire-and-forget verification email
  try {
    await sendEmailVerification(cred.user);
  } catch {
    // ignore — UI can expose "Resend verification" if needed
  }

  await setDoc(
    doc(db, "users", cred.user.uid),
    {
      uid: cred.user.uid,
      email,
      displayName: displayName ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return cred.user;
}

/**
 * Standard email/password sign-in.
 * (UI can check email verification status after this if desired.)
 */
export function signInWithEmailPassword(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

/** Sign out current user. */
export function signOutUser() {
  return signOut(auth);
}

/** Observe auth state (used by your AuthProvider). */
export function observeAuth(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

/** Resend verification email for the currently signed-in user. */
export async function resendVerificationEmail() {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
}

/** Send password reset email. */
export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

/* -------------------- Email verification helpers -------------------- */

/**
 * Reload the current user and return the latest verification flag.
 * Use this if you want to check on demand (e.g., after user tapped
 * “I’ve verified my email”).
 */
export async function isCurrentUserVerified(): Promise<boolean> {
  const u = auth.currentUser;
  if (!u) return false;
  try {
    await reload(u); // fetch latest claims
  } catch {}
  return !!auth.currentUser?.emailVerified;
}

/**
 * Subscribe to verification becoming true.
 * Calls `onVerified()` once (then unsubscribes itself).
 * Useful to pop your “Successfully verified” modal automatically
 * if the user returns to the app after clicking the email link.
 */
export function onEmailVerifiedOnce(onVerified: () => void): Unsubscribe {
  const unsub = onAuthStateChanged(auth, async (user) => {
    if (!user) return; // signed out
    try {
      await reload(user);
    } catch {}
    if (user.emailVerified) {
      try {
        onVerified?.();
      } finally {
        unsub(); // ensure it only fires once
      }
    }
  });
  return unsub;
}
