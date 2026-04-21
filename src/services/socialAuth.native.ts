import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import {
  type AuthCredential,
  FacebookAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  updateProfile,
} from "firebase/auth";
import { getFirebaseAuth } from "@/services/firebaseClient";
import { upsertUserProfile } from "@/services/userProfile";
import {
  isSocialSignInCancelled as isSharedSocialSignInCancelled,
  SocialSignInCancelledError,
  type SocialAuthProvider,
} from "@/services/socialAuthShared";

let googleConfigured = false;
let facebookConfigured = false;

const PUBLIC_ENV = {
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  EXPO_PUBLIC_GOOGLE_IOS_REVERSED_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_REVERSED_CLIENT_ID,
  EXPO_PUBLIC_FACEBOOK_APP_ID: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
  EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN: process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN,
} as const;

function readEnv(name: string) {
  const value = PUBLIC_ENV[name as keyof typeof PUBLIC_ENV];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function isSocialSignInCancelled(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code)
      : null;

  return (
    isSharedSocialSignInCancelled(error) ||
    code === "ERR_REQUEST_CANCELED" ||
    code === "ERR_CANCELED"
  );
}

export function getMissingSocialAuthConfig(provider: SocialAuthProvider) {
  if (provider === "apple") {
    return [];
  }

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
  credentialProvider: SocialAuthProvider,
  credential: AuthCredential
) {
  const result = await signInWithCredential(getFirebaseAuth(), credential);
  await upsertUserProfile(result.user, credentialProvider).catch(() => {});
  return result.user;
}

function randomNonce(length = 32) {
  const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._";
  let nonce = "";
  for (let index = 0; index < length; index += 1) {
    nonce += charset[Math.floor(Math.random() * charset.length)];
  }
  return nonce;
}

function formatAppleName(fullName: AppleAuthentication.AppleAuthenticationFullName | null) {
  if (!fullName) return null;
  return [fullName.givenName, fullName.middleName, fullName.familyName]
    .filter(Boolean)
    .join(" ")
    .trim() || null;
}

export async function signInWithAppleAccount() {
  if (Platform.OS !== "ios") {
    throw new Error("Sign in with Apple is available on iOS only.");
  }

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error("Sign in with Apple is not available on this device.");
  }

  const rawNonce = randomNonce();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  const response = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!response.identityToken) {
    throw new Error("Apple did not return a usable identity token.");
  }

  const provider = new OAuthProvider("apple.com");
  const credential = provider.credential({
    idToken: response.identityToken,
    rawNonce,
  });
  const user = await finishFirebaseSignIn("apple", credential);
  const appleName = formatAppleName(response.fullName);
  if (appleName && !user.displayName) {
    await updateProfile(user, { displayName: appleName }).catch(() => {});
    await upsertUserProfile(user, "apple", { displayName: appleName }).catch(() => {});
  }

  return user;
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
  Settings.setAppName("Hudaa");
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
