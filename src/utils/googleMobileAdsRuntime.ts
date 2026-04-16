import Constants from "expo-constants";
import { NativeModules, TurboModuleRegistry } from "react-native";

const GOOGLE_MOBILE_ADS_MODULE = "RNGoogleMobileAdsModule";

export function hasGoogleMobileAdsNativeModule() {
  if (Constants.appOwnership === "expo") return false;

  if (GOOGLE_MOBILE_ADS_MODULE in NativeModules) return true;

  try {
    return !!TurboModuleRegistry.get(GOOGLE_MOBILE_ADS_MODULE);
  } catch {
    return false;
  }
}
