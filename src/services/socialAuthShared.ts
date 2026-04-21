export type SocialAuthProvider = "apple" | "google" | "facebook";

export class SocialSignInCancelledError extends Error {
  constructor() {
    super("Sign-in was cancelled.");
    this.name = "SocialSignInCancelledError";
  }
}

export function isSocialSignInCancelled(error: unknown) {
  return error instanceof SocialSignInCancelledError;
}
