import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { getFirebaseAuth } from "@/services/firebaseClient";
import {
  isSocialSignInCancelled as isSharedSocialSignInCancelled,
  type SocialAuthProvider,
} from "@/services/socialAuthShared";
import { upsertUserProfile } from "@/services/userProfile";

export function isSocialSignInCancelled(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code)
      : null;
  return (
    isSharedSocialSignInCancelled(error) ||
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request"
  );
}

export function getMissingSocialAuthConfig(provider: SocialAuthProvider) {
  return [];
}

export async function signInWithGoogleAccount() {
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");

  const result = await signInWithPopup(getFirebaseAuth(), provider);
  await upsertUserProfile(result.user, "google").catch(() => {});
  return result.user;
}

export async function signInWithFacebookAccount() {
  const provider = new FacebookAuthProvider();
  provider.addScope("public_profile");
  provider.addScope("email");

  const result = await signInWithPopup(getFirebaseAuth(), provider);
  await upsertUserProfile(result.user, "facebook").catch(() => {});
  return result.user;
}
