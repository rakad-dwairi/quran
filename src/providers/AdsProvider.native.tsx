import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { hasGoogleMobileAdsNativeModule } from "@/utils/googleMobileAdsRuntime";

export function AdsProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    if (!hasGoogleMobileAdsNativeModule()) return;

    let cancelled = false;

    async function initializeAds() {
      try {
        const { default: mobileAds, MaxAdContentRating } = await import(
          "react-native-google-mobile-ads"
        );

        await mobileAds().setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.PG,
          testDeviceIdentifiers: ["EMULATOR"],
        });

        if (!cancelled) {
          await mobileAds().initialize();
        }
      } catch (error) {
        if (__DEV__) {
          console.warn("Google Mobile Ads is unavailable in this runtime.", error);
        }
      }
    }

    void initializeAds();

    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}
