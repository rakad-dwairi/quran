import { Platform } from "react-native";

export const ADMOB_APP_IDS = {
  android: "ca-app-pub-9413843584219893~5507752826",
  ios: "ca-app-pub-9413843584219893~6820834493",
} as const;

export const ADMOB_BANNER_UNIT_IDS = {
  android: "ca-app-pub-9413843584219893/2881589485",
  ios: "ca-app-pub-9413843584219893/5144790745",
} as const;

export function getProductionBannerAdUnitId() {
  if (Platform.OS === "android") return ADMOB_BANNER_UNIT_IDS.android;
  if (Platform.OS === "ios") return ADMOB_BANNER_UNIT_IDS.ios;
  return null;
}
