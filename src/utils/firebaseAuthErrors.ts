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
      return "Email/Password sign-in is disabled in Firebase Console → Authentication.";
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

