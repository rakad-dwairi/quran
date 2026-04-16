import { Platform } from "react-native";

export const ADMOB_APP_IDS = {
  android: "ca-app-pub-9413843584219893~5507752826",
  ios: "ca-app-pub-9413843584219893~6820834493",
} as const;

export const ADMOB_BANNER_UNIT_IDS = {
  android: "ca-app-pub-9413843584219893/2881589485",
  ios: "ca-app-pub-9413843584219893/5144790745",
} as const;

export const ADMOB_INTERSTITIAL_UNIT_IDS = {
  android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_UNIT_ID,
  ios: process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_UNIT_ID,
} as const;

export function getProductionBannerAdUnitId() {
  if (Platform.OS === "android") return ADMOB_BANNER_UNIT_IDS.android;
  if (Platform.OS === "ios") return ADMOB_BANNER_UNIT_IDS.ios;
  return null;
}

export function getProductionInterstitialAdUnitId() {
  if (Platform.OS === "android") return ADMOB_INTERSTITIAL_UNIT_IDS.android || null;
  if (Platform.OS === "ios") return ADMOB_INTERSTITIAL_UNIT_IDS.ios || null;
  return null;
}
