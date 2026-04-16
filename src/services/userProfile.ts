import type { User } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/services/firebaseClient";

export async function upsertUserProfile(
  user: User,
  provider: "email" | "google" | "facebook"
) {
  const names = (user.displayName ?? "").trim().split(/\s+/).filter(Boolean);
  const firstName = names[0] ?? null;
  const lastName = names.length > 1 ? names.slice(1).join(" ") : null;

  await setDoc(
    doc(getFirestoreDb(), "users", user.uid),
    {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      firstName,
      lastName,
      photoURL: user.photoURL ?? null,
      phone: user.phoneNumber ?? null,
      authProvider: provider,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
