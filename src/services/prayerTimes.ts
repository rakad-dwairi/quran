import { CalculationMethod, Coordinates, Madhab, PrayerTimes, Qibla } from "adhan";
import {
  PRAYER_CALCULATION_METHOD_OPTIONS,
  PRAYER_IDS,
  PRAYER_LABELS,
  PRAYER_MADHAB_OPTIONS,
  type PrayerCalculationMethod,
  type PrayerId,
  type PrayerMadhab,
} from "@/constants/prayer";

export type PrayerCoordinates = {
  latitude: number;
  longitude: number;
};

export type PrayerTimeRecord = Record<PrayerId, Date>;

export type PrayerTimingSettings = {
  calculationMethod: PrayerCalculationMethod;
  madhab: PrayerMadhab;
};

export type BuiltPrayerTimes = {
  coordinates: Coordinates;
  params: ReturnType<typeof CalculationMethod.MuslimWorldLeague>;
  qiblaDegrees: number;
  times: PrayerTimeRecord;
};

export function getPrayerCalculationMethodLabel(method: PrayerCalculationMethod) {
  return PRAYER_CALCULATION_METHOD_OPTIONS.find((option) => option.value === method)?.label ?? method;
}

export function getPrayerMadhabLabel(madhab: PrayerMadhab) {
  return PRAYER_MADHAB_OPTIONS.find((option) => option.value === madhab)?.label ?? madhab;
}

export function buildPrayerCalculationParams({
  calculationMethod,
  madhab,
}: PrayerTimingSettings): ReturnType<typeof CalculationMethod.MuslimWorldLeague> {
  const params = (() => {
    switch (calculationMethod) {
      case "ummAlQura":
        return CalculationMethod.UmmAlQura();
      case "egyptian":
        return CalculationMethod.Egyptian();
      case "isna":
        return CalculationMethod.NorthAmerica();
      case "muslimWorldLeague":
      default:
        return CalculationMethod.MuslimWorldLeague();
    }
  })();

  params.madhab = madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  return params;
}

export function buildPrayerTimes(
  coords: PrayerCoordinates,
  date: Date,
  settings: PrayerTimingSettings
): BuiltPrayerTimes {
  const coordinates = new Coordinates(coords.latitude, coords.longitude);
  const params = buildPrayerCalculationParams(settings);
  const times = new PrayerTimes(coordinates, date, params);

  return {
    coordinates,
    params,
    qiblaDegrees: Qibla(coordinates),
    times: {
      fajr: times.fajr,
      dhuhr: times.dhuhr,
      asr: times.asr,
      maghrib: times.maghrib,
      isha: times.isha,
    },
  };
}

export function getNextPrayer(
  today: PrayerTimeRecord,
  {
    coordinates,
    params,
    now = new Date(),
  }: { coordinates: Coordinates; params: BuiltPrayerTimes["params"]; now?: Date }
) {
  for (const id of PRAYER_IDS) {
    if (today[id].getTime() > now.getTime()) return { id, at: today[id] };
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const next = new PrayerTimes(coordinates, tomorrow, params);
  return { id: "fajr" as const, at: next.fajr };
}

export function getActivePrayer(today: PrayerTimeRecord, now = new Date()): PrayerId | null {
  let active: PrayerId | null = null;

  for (const id of PRAYER_IDS) {
    if (today[id].getTime() <= now.getTime()) {
      active = id;
    }
  }

  return active;
}

export function formatPrayerTime(value: Date) {
  return value.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatPrayerDate(value: Date) {
  return value.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatPrayerCountdown(ms: number) {
  const safeSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function getPrayerLabel(id: PrayerId) {
  return PRAYER_LABELS[id];
}
