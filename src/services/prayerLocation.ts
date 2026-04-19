import * as Location from "expo-location";
import type { PrayerLocationMode } from "@/constants/prayer";
import type { PrayerCoordinates } from "@/services/prayerTimes";
import { confirmLocationPermission } from "@/utils/permissionPrompts";

export type PrayerLocationResult = {
  coords: PrayerCoordinates;
  place: string | null;
};

function formatPlace(place: Location.LocationGeocodedAddress) {
  const parts = [place.city, place.region, place.country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export async function reverseGeocodePrayerPlace(coords: PrayerCoordinates) {
  try {
    const places = await Location.reverseGeocodeAsync(coords);
    const first = places[0];
    return first ? formatPlace(first) : null;
  } catch {
    return null;
  }
}

export async function getAutoPrayerLocation({ requestPermission }: { requestPermission: boolean }) {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new Error("Location services are disabled. Enable them and try again.");
  }

  let permission = await Location.getForegroundPermissionsAsync();
  if (requestPermission && permission.status !== "granted") {
    const shouldAsk = await confirmLocationPermission();
    if (!shouldAsk) {
      throw new Error("Location permission was not requested. You can use manual location instead.");
    }
    permission = await Location.requestForegroundPermissionsAsync();
  }

  if (permission.status !== "granted") {
    throw new Error("Location permission is needed for automatic prayer times.");
  }

  const lastKnown = await Location.getLastKnownPositionAsync();
  const position =
    lastKnown ??
    (await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }));

  const coords = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };

  return {
    coords,
    place: await reverseGeocodePrayerPlace(coords),
  } satisfies PrayerLocationResult;
}

export async function geocodeManualPrayerLocation(city: string, country: string) {
  const query = [city.trim(), country.trim()].filter(Boolean).join(", ");
  if (!query) {
    throw new Error("Enter a city or country first.");
  }

  const matches = await Location.geocodeAsync(query);
  const first = matches[0];
  if (!first) {
    throw new Error("Could not find that location. Try a more specific city and country.");
  }

  const coords = {
    latitude: first.latitude,
    longitude: first.longitude,
  };

  return {
    coords,
    place: query,
  } satisfies PrayerLocationResult;
}

export function buildManualPrayerLocation({
  city,
  country,
  latitude,
  longitude,
}: {
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
}) {
  if (latitude === null || longitude === null) return null;
  const place = [city.trim(), country.trim()].filter(Boolean).join(", ") || null;
  return {
    coords: { latitude, longitude },
    place,
  } satisfies PrayerLocationResult;
}

export async function resolvePrayerLocation({
  mode,
  manual,
  requestPermission,
}: {
  mode: PrayerLocationMode;
  manual: {
    city: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
  };
  requestPermission: boolean;
}) {
  if (mode === "manual") {
    const location = buildManualPrayerLocation(manual);
    if (!location) {
      throw new Error("Set and save a manual location before scheduling prayer alerts.");
    }
    return location;
  }

  return getAutoPrayerLocation({ requestPermission });
}
