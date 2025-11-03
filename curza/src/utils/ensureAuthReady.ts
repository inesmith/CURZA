import { getAuth, onAuthStateChanged } from "firebase/auth";

export async function ensureAuthReady(): Promise<void> {
  const auth = getAuth();
  if (auth.currentUser) return;
  await new Promise<void>((resolve) => {
    const unsub = onAuthStateChanged(auth, () => {
      unsub();
      resolve();
    });
  });
}
