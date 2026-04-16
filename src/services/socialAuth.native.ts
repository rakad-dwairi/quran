import { Platform } from "react-native";
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { getFirebaseAuth } from "@/services/firebaseClient";
import { upsertUserProfile } from "@/services/userProfile";
import {
  isSocialSignInCancelled,
  SocialSignInCancelledError,
  type SocialAuthProvider,
} from "@/services/socialAuthShared";

let googleConfigured = false;
let facebookConfigured = false;

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export { isSocialSignInCancelled };

export function getMissingSocialAuthConfig(provider: SocialAuthProvider) {
  if (provider === "google") {
    const required = [["EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID", readEnv("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID")]];

    if (Platform.OS === "ios") {
      required.push(
        ["EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID", readEnv("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID")],
        [
          "EXPO_PUBLIC_GOOGLE_IOS_REVERSED_CLIENT_ID",
          readEnv("EXPO_PUBLIC_GOOGLE_IOS_REVERSED_CLIENT_ID"),
        ]
      );
    }

    return required.filter(([, value]) => !value).map(([name]) => name);
  }

  return [
    ["EXPO_PUBLIC_FACEBOOK_APP_ID", readEnv("EXPO_PUBLIC_FACEBOOK_APP_ID")],
    ["EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN", readEnv("EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN")],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
}

async function finishFirebaseSignIn(
  credentialProvider: "google" | "facebook",
  credential: ReturnType<typeof GoogleAuthProvider.credential>
) {
  const result = await signInWithCredential(getFirebaseAuth(), credential);
  await upsertUserProfile(result.user, credentialProvider).catch(() => {});
  return result.user;
}

function configureGoogleSignIn() {
  if (googleConfigured) return;

  const missing = getMissingSocialAuthConfig("google");
  if (missing.length) {
    throw new Error(`Missing ${missing.join(", ")} in \`.env\`.`);
  }

  const webClientId = readEnv("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID")!;
  const iosClientId = readEnv("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID") ?? undefined;

  const { GoogleSignin } = require("@react-native-google-signin/google-signin") as typeof import("@react-native-google-signin/google-signin");
  GoogleSignin.configure({
    webClientId,
    iosClientId,
    scopes: ["profile", "email"],
  });

  googleConfigured = true;
}

export async function signInWithGoogleAccount() {
  configureGoogleSignIn();

  const { GoogleSignin } = require("@react-native-google-signin/google-signin") as typeof import("@react-native-google-signin/google-signin");

  if (Platform.OS === "android") {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const response = await GoogleSignin.signIn();
  if (response.type === "cancelled") {
    throw new SocialSignInCancelledError();
  }

  const tokens = await GoogleSignin.getTokens();
  const idToken = response.data.idToken ?? tokens.idToken;
  if (!idToken && !tokens.accessToken) {
    throw new Error("Google did not return a usable sign-in token.");
  }

  return finishFirebaseSignIn(
    "google",
    GoogleAuthProvider.credential(idToken, tokens.accessToken)
  );
}

function configureFacebookSignIn() {
  if (facebookConfigured) return;

  const appID = readEnv("EXPO_PUBLIC_FACEBOOK_APP_ID");
  const clientToken = readEnv("EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN");
  if (!appID || !clientToken) {
    throw new Error(
      "Missing EXPO_PUBLIC_FACEBOOK_APP_ID or EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN in `.env`."
    );
  }

  const { Settings } = require("react-native-fbsdk-next") as typeof import("react-native-fbsdk-next");
  Settings.setAppID(appID);
  Settings.setClientToken(clientToken);
  Settings.setAppName("Quran");
  Settings.setAutoLogAppEventsEnabled(false);
  Settings.setAdvertiserIDCollectionEnabled(false);
  Settings.initializeSDK();

  facebookConfigured = true;
}

export async function signInWithFacebookAccount() {
  configureFacebookSignIn();

  const { AccessToken, LoginManager } = require("react-native-fbsdk-next") as typeof import("react-native-fbsdk-next");

  LoginManager.logOut();
  const result = await LoginManager.logInWithPermissions(["public_profile", "email"]);
  if (result.isCancelled) {
    throw new SocialSignInCancelledError();
  }

  const token = await AccessToken.getCurrentAccessToken();
  if (!token?.accessToken) {
    throw new Error("Facebook did not return a usable access token.");
  }

  return finishFirebaseSignIn(
    "facebook",
    FacebookAuthProvider.credential(token.accessToken)
  );
}
