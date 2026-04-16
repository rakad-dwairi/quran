export function friendlyFirebaseAuthError(e: unknown) {
  const code =
    typeof e === "object" && e && "code" in e ? String((e as any).code) : null;
  if (!code) return e instanceof Error ? e.message : "Please try again.";

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/missing-password":
      return "Please enter your password.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/email-already-in-use":
      return "This email is already registered. Try signing in instead.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Wrong email or password (or the account doesn’t exist).";
    case "auth/operation-not-allowed":
      return "This sign-in method is disabled in Firebase Console -> Authentication.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using another sign-in method. Sign in with that method first.";
    case "auth/credential-already-in-use":
      return "This social account is already linked to another user.";
    case "auth/popup-blocked":
      return "The browser blocked the sign-in popup. Allow popups and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a bit and try again.";
    case "auth/invalid-api-key":
      return "Firebase API key is invalid. Double-check your `.env` values and restart Expo.";
    default:
      return e instanceof Error ? e.message : code;
  }
}
