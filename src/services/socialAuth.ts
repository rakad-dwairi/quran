export {
  isSocialSignInCancelled,
  SocialSignInCancelledError,
  type SocialAuthProvider,
} from "@/services/socialAuthShared";

import type { SocialAuthProvider } from "@/services/socialAuthShared";

export function getMissingSocialAuthConfig(provider: SocialAuthProvider) {
  return provider === "google"
    ? ["EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"]
    : ["EXPO_PUBLIC_FACEBOOK_APP_ID", "EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN"];
}

export async function signInWithGoogleAccount() {
  throw new Error("Google sign-in is not available in this runtime.");
}

export async function signInWithFacebookAccount() {
  throw new Error("Facebook sign-in is not available in this runtime.");
}
