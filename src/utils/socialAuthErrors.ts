import { fetchSignInMethodsForEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/services/firebaseClient";
import type { SocialAuthProvider } from "@/services/socialAuthShared";
import { friendlyFirebaseAuthError } from "@/utils/firebaseAuthErrors";

const SOCIAL_PROVIDER_LABELS: Record<SocialAuthProvider, string> = {
  google: "Google",
  facebook: "Facebook",
};

const SIGN_IN_METHOD_LABELS: Record<string, string> = {
  password: "email + password",
  "google.com": "Google",
  "facebook.com": "Facebook",
};

function getErrorCode(error: unknown) {
  return typeof error === "object" && error && "code" in error
    ? String((error as { code?: unknown }).code)
    : null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "";
}

function getErrorEmail(error: unknown) {
  if (typeof error !== "object" || !error) return null;

  if ("customData" in error) {
    const email = (error as { customData?: { email?: unknown } }).customData?.email;
    if (typeof email === "string" && email.trim()) return email.trim();
  }

  if ("email" in error) {
    const email = (error as { email?: unknown }).email;
    if (typeof email === "string" && email.trim()) return email.trim();
  }

  return null;
}

function getPreferredMethodLabel(methods: string[]) {
  for (const method of methods) {
    const label = SIGN_IN_METHOD_LABELS[method];
    if (label) return label;
  }

  return methods[0] ?? null;
}

export async function getFriendlySocialAuthError(
  error: unknown,
  attemptedProvider: SocialAuthProvider
) {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);

  if (
    attemptedProvider === "google" &&
    (code === "10" ||
      code === "DEVELOPER_ERROR" ||
      message.includes("DEVELOPER_ERROR"))
  ) {
    return "Google sign-in is misconfigured for this Android build. Add this app's SHA-1 and SHA-256 fingerprints in Firebase for the Android app, then rebuild.";
  }

  if (code === "auth/account-exists-with-different-credential") {
    const email = getErrorEmail(error);

    if (email) {
      try {
        const methods = await fetchSignInMethodsForEmail(getFirebaseAuth(), email);
        const methodLabel = getPreferredMethodLabel(methods);
        if (methodLabel) {
          return `This email is already registered with ${methodLabel}. Sign in with ${methodLabel} first, then use ${SOCIAL_PROVIDER_LABELS[attemptedProvider]}.`;
        }
      } catch {
        // Fall back to the generic mapping below.
      }
    }
  }

  return friendlyFirebaseAuthError(error);
}
