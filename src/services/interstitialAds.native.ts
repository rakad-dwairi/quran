import { getProductionInterstitialAdUnitId } from "@/constants/adMob";
import { hasGoogleMobileAdsNativeModule } from "@/utils/googleMobileAdsRuntime";

type GoogleMobileAdsModule = typeof import("react-native-google-mobile-ads");
type InterstitialAdInstance = ReturnType<
  GoogleMobileAdsModule["InterstitialAd"]["createForAdRequest"]
>;

const ACTIONS_BETWEEN_SHOWS = __DEV__ ? 1 : 2;
const MIN_TIME_BETWEEN_SHOWS_MS = __DEV__ ? 15 * 1000 : 90 * 1000;
const LOAD_TIMEOUT_MS = 8000;
const SHOW_TIMEOUT_MS = 30000;

let interstitialAd: InterstitialAdInstance | null = null;
let loadPromise: Promise<boolean> | null = null;
let eligibleActionCount = 0;
let lastShownAt = 0;

function canUseInterstitials() {
  return hasGoogleMobileAdsNativeModule();
}

async function getAdMobModule() {
  if (!canUseInterstitials()) return null;

  try {
    return await import("react-native-google-mobile-ads");
  } catch (error) {
    if (__DEV__) {
      console.warn("Google Mobile Ads interstitial is unavailable in this runtime.", error);
    }
    return null;
  }
}

function getAdUnitId(module: GoogleMobileAdsModule) {
  if (__DEV__) return module.TestIds?.INTERSTITIAL || null;
  return getProductionInterstitialAdUnitId();
}

function shouldAttemptToShow() {
  eligibleActionCount += 1;

  if (eligibleActionCount < ACTIONS_BETWEEN_SHOWS) return false;
  if (Date.now() - lastShownAt < MIN_TIME_BETWEEN_SHOWS_MS) return false;

  return true;
}

export async function preloadInterstitialAd() {
  if (interstitialAd?.loaded) return true;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const module = await getAdMobModule();
    if (!module) return false;

    const unitId = getAdUnitId(module);
    if (!unitId) return false;

    const ad = module.InterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    interstitialAd = ad;

    return new Promise<boolean>((resolve) => {
      let settled = false;
      const cleanup = () => {
        clearTimeout(timeout);
        unsubscribeLoaded();
        unsubscribeError();
      };
      const settle = (loaded: boolean) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(loaded);
      };

      const unsubscribeLoaded = ad.addAdEventListener(module.AdEventType.LOADED, () => {
        settle(true);
      });
      const unsubscribeError = ad.addAdEventListener(module.AdEventType.ERROR, () => {
        if (interstitialAd === ad) interstitialAd = null;
        settle(false);
      });
      ad.addAdEventListener(module.AdEventType.CLOSED, () => {
        if (interstitialAd === ad) interstitialAd = null;
        void preloadInterstitialAd();
      });

      const timeout = setTimeout(() => settle(ad.loaded), LOAD_TIMEOUT_MS);
      ad.load();
    });
  })().finally(() => {
    loadPromise = null;
  });

  return loadPromise;
}

export async function showInterstitialAdIfAvailable() {
  if (!shouldAttemptToShow()) {
    void preloadInterstitialAd();
    return false;
  }

  const loaded = await preloadInterstitialAd();
  const ad = interstitialAd;
  if (!loaded || !ad?.loaded) {
    void preloadInterstitialAd();
    return false;
  }

  const module = await getAdMobModule();
  if (!module) return false;

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const cleanup = () => {
      clearTimeout(timeout);
      unsubscribeClosed();
      unsubscribeError();
    };
    const settle = (shown: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(shown);
    };

    const unsubscribeClosed = ad.addAdEventListener(module.AdEventType.CLOSED, () => {
      lastShownAt = Date.now();
      eligibleActionCount = 0;
      settle(true);
    });
    const unsubscribeError = ad.addAdEventListener(module.AdEventType.ERROR, () => {
      if (interstitialAd === ad) interstitialAd = null;
      void preloadInterstitialAd();
      settle(false);
    });
    const timeout = setTimeout(() => settle(false), SHOW_TIMEOUT_MS);

    ad.show().catch(() => {
      if (interstitialAd === ad) interstitialAd = null;
      void preloadInterstitialAd();
      settle(false);
    });
  });
}
