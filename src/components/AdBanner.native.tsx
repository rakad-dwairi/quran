import { useEffect, useState } from "react";
import { View } from "react-native";
import { getProductionBannerAdUnitId } from "@/constants/adMob";
import { hasGoogleMobileAdsNativeModule } from "@/utils/googleMobileAdsRuntime";

type GoogleMobileAdsModule = Pick<
  typeof import("react-native-google-mobile-ads"),
  "BannerAd" | "BannerAdSize" | "TestIds"
>;

export function AdBanner() {
  const [adsModule, setAdsModule] = useState<GoogleMobileAdsModule | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!hasGoogleMobileAdsNativeModule()) {
      setUnavailable(true);
      return;
    }

    let mounted = true;

    import("react-native-google-mobile-ads")
      .then(({ BannerAd, BannerAdSize, TestIds }) => {
        if (mounted) setAdsModule({ BannerAd, BannerAdSize, TestIds });
      })
      .catch((error) => {
        if (mounted) setUnavailable(true);
        if (__DEV__) {
          console.warn("Google Mobile Ads banner is unavailable in this runtime.", error);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (unavailable || !adsModule) return null;

  const unitId = __DEV__
    ? adsModule.TestIds?.BANNER
    : getProductionBannerAdUnitId();
  const BannerAd = adsModule.BannerAd;
  const bannerSize = adsModule.BannerAdSize?.BANNER;

  if (!BannerAd || !bannerSize || !unitId) return null;

  return (
    <View className="items-center justify-center border-t border-border bg-bg py-1">
      <BannerAd
        unitId={unitId}
        size={bannerSize}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}
