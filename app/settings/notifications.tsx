import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import {
  PRAYER_ADHAN_SOUND_OPTIONS,
  PRAYER_CALCULATION_METHOD_OPTIONS,
  PRAYER_MADHAB_OPTIONS,
  PRAYER_REMINDER_OPTIONS,
  type PrayerAdhanSound,
  type PrayerCalculationMethod,
  type PrayerMadhab,
  type PrayerReminderMinutes,
} from "@/constants/prayer";
import {
  cancelDailyVerseNotifications,
  scheduleDailyVerseNotifications,
  sendTestDailyVerseNotification,
} from "@/services/dailyVerseNotifications";
import { geocodeManualPrayerLocation, resolvePrayerLocation } from "@/services/prayerLocation";
import {
  cancelPrayerNotifications,
  schedulePrayerNotifications,
  sendTestPrayerNotification,
  type PrayerNotificationSettings,
} from "@/services/prayerNotifications";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";
import { confirmNotificationPermission } from "@/utils/permissionPrompts";

type PickerOption = {
  label: string;
  selected: boolean;
  onPress: () => void | Promise<void>;
};

type PickerState = {
  title: string;
  subtitle?: string;
  options: PickerOption[];
};

function formatTime(hour: number, minute: number) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const MINUTES = [0, 30] as const;
const TIME_OPTIONS = Array.from({ length: 24 }).flatMap((_, hour) => MINUTES.map((minute) => ({ hour, minute })));

async function ensurePermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;
  const shouldAsk = await confirmNotificationPermission();
  if (!shouldAsk) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === "granted";
}

function optionLabel<T extends string | number>(options: Array<{ value: T; label: string }>, value: T) {
  return options.find((option) => option.value === value)?.label ?? String(value);
}

function SettingsRow({
  title,
  subtitle,
  disabled,
  onPress,
}: {
  title: string;
  subtitle: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`mt-3 flex-row items-center justify-between rounded-2xl border border-border px-4 py-3 active:opacity-80 ${
        disabled ? "bg-mutedBg opacity-60" : "bg-bg"
      }`}
      disabled={disabled}
      onPress={onPress}
    >
      <View className="flex-1 pr-4">
        <Text className="font-uiMedium text-sm text-text">{title}</Text>
        <Text className="mt-0.5 font-ui text-sm text-muted" numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
    </Pressable>
  );
}

export default function NotificationsSettingsScreen() {
  const {
    translationId,
    appLanguage,
    dailyVerseEnabled,
    dailyVerseHour,
    dailyVerseMinute,
    prayerNotificationsEnabled,
    prayerAdhanEnabled,
    prayerAdhanSound,
    prayerCalculationMethod,
    prayerMadhab,
    prayerLocationMode,
    prayerManualCity,
    prayerManualCountry,
    prayerManualLatitude,
    prayerManualLongitude,
    prayerReminderMinutes,
    prayerPerPrayerNotifications,
    setDailyVerseEnabled,
    setDailyVerseTime,
    setPrayerNotificationsEnabled,
    setPrayerAdhanEnabled,
    setPrayerAdhanSound,
    setPrayerCalculationMethod,
    setPrayerMadhab,
    setPrayerLocationMode,
    setPrayerManualLocation,
    setPrayerReminderMinutes,
  } = useSettingsStore(
    useShallow((state) => ({
      translationId: state.translationId,
      appLanguage: state.appLanguage,
      dailyVerseEnabled: state.dailyVerseEnabled,
      dailyVerseHour: state.dailyVerseHour,
      dailyVerseMinute: state.dailyVerseMinute,
      prayerNotificationsEnabled: state.prayerNotificationsEnabled,
      prayerAdhanEnabled: state.prayerAdhanEnabled,
      prayerAdhanSound: state.prayerAdhanSound,
      prayerCalculationMethod: state.prayerCalculationMethod,
      prayerMadhab: state.prayerMadhab,
      prayerLocationMode: state.prayerLocationMode,
      prayerManualCity: state.prayerManualCity,
      prayerManualCountry: state.prayerManualCountry,
      prayerManualLatitude: state.prayerManualLatitude,
      prayerManualLongitude: state.prayerManualLongitude,
      prayerReminderMinutes: state.prayerReminderMinutes,
      prayerPerPrayerNotifications: state.prayerPerPrayerNotifications,
      setDailyVerseEnabled: state.setDailyVerseEnabled,
      setDailyVerseTime: state.setDailyVerseTime,
      setPrayerNotificationsEnabled: state.setPrayerNotificationsEnabled,
      setPrayerAdhanEnabled: state.setPrayerAdhanEnabled,
      setPrayerAdhanSound: state.setPrayerAdhanSound,
      setPrayerCalculationMethod: state.setPrayerCalculationMethod,
      setPrayerMadhab: state.setPrayerMadhab,
      setPrayerLocationMode: state.setPrayerLocationMode,
      setPrayerManualLocation: state.setPrayerManualLocation,
      setPrayerReminderMinutes: state.setPrayerReminderMinutes,
    }))
  );

  const [busy, setBusy] = useState(false);
  const [dailyPickerOpen, setDailyPickerOpen] = useState(false);
  const [picker, setPicker] = useState<PickerState | null>(null);
  const [manualCity, setManualCity] = useState(prayerManualCity);
  const [manualCountry, setManualCountry] = useState(prayerManualCountry);

  useEffect(() => {
    setManualCity(prayerManualCity);
    setManualCountry(prayerManualCountry);
  }, [prayerManualCity, prayerManualCountry]);

  const timeLabel = useMemo(() => formatTime(dailyVerseHour, dailyVerseMinute), [dailyVerseHour, dailyVerseMinute]);
  const manualLocationLabel =
    prayerManualLatitude !== null && prayerManualLongitude !== null
      ? [prayerManualCity, prayerManualCountry].filter(Boolean).join(", ") ||
        `${prayerManualLatitude.toFixed(3)}, ${prayerManualLongitude.toFixed(3)}`
      : "Not set";

  function buildPrayerScheduleSettings(
    overrides: Partial<PrayerNotificationSettings> = {}
  ): PrayerNotificationSettings {
    return {
      appLanguage,
      notificationsEnabled: prayerNotificationsEnabled,
      adhanEnabled: prayerAdhanEnabled,
      adhanSound: prayerAdhanSound,
      calculationMethod: prayerCalculationMethod,
      madhab: prayerMadhab,
      reminderMinutes: prayerReminderMinutes,
      perPrayerNotifications: prayerPerPrayerNotifications,
      ...overrides,
    };
  }

  async function applyDailyVerseSchedule({ hour, minute }: { hour: number; minute: number }) {
    setBusy(true);
    try {
      const res = await scheduleDailyVerseNotifications({
        hour,
        minute,
        translationId,
        appLanguage,
        daysAhead: 14,
      });
      Alert.alert("Scheduled", `Daily verse notifications are set. (${res.scheduledCount} upcoming)`);
    } catch (e) {
      Alert.alert("Scheduling failed", e instanceof Error ? e.message : "Please try again.");
      setDailyVerseEnabled(false);
    } finally {
      setBusy(false);
    }
  }

  async function applyPrayerSchedule(
    overrides: Partial<PrayerNotificationSettings> = {},
    options: {
      requestLocationPermission?: boolean;
      locationMode?: "auto" | "manual";
      manual?: {
        city: string;
        country: string;
        latitude: number | null;
        longitude: number | null;
      };
    } = {}
  ) {
    const settings = buildPrayerScheduleSettings(overrides);
    const manual = options.manual ?? {
      city: prayerManualCity,
      country: prayerManualCountry,
      latitude: prayerManualLatitude,
      longitude: prayerManualLongitude,
    };
    const location = await resolvePrayerLocation({
      mode: options.locationMode ?? prayerLocationMode,
      manual,
      requestPermission: options.requestLocationPermission ?? true,
    });

    return schedulePrayerNotifications({
      coords: location.coords,
      place: location.place,
      settings,
    });
  }

  async function updatePrayerScheduleAfterChange(overrides: Partial<PrayerNotificationSettings>) {
    if (!prayerNotificationsEnabled) return;
    setBusy(true);
    try {
      await applyPrayerSchedule(overrides);
    } catch (e) {
      Alert.alert("Prayer alerts not updated", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function openPrayerOptionPicker<T extends string | number>({
    title,
    subtitle,
    options,
    value,
    onSelect,
  }: {
    title: string;
    subtitle?: string;
    options: Array<{ value: T; label: string }>;
    value: T;
    onSelect: (value: T) => void | Promise<void>;
  }) {
    setPicker({
      title,
      subtitle,
      options: options.map((option) => ({
        label: option.label,
        selected: option.value === value,
        onPress: async () => {
          setPicker(null);
          await onSelect(option.value);
        },
      })),
    });
  }

  return (
    <Screen className="pt-6" padded={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="px-6">
        <AppHeader title="Notifications" subtitle="Daily reminders and prayer alerts." showBack />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="font-uiSemibold text-base text-text">Daily verse</Text>
              <Text className="mt-1 font-ui text-sm text-muted">Receive a verse of the day as a notification.</Text>
            </View>
            <Switch
              value={dailyVerseEnabled}
              onValueChange={async (next) => {
                if (busy) return;
                setDailyVerseEnabled(next);
                if (!next) {
                  setBusy(true);
                  try {
                    await cancelDailyVerseNotifications();
                  } finally {
                    setBusy(false);
                  }
                  return;
                }

                const ok = await ensurePermission();
                if (!ok) {
                  Alert.alert("Permission needed", "Enable notifications to receive a daily verse.");
                  setDailyVerseEnabled(false);
                  return;
                }

                await applyDailyVerseSchedule({ hour: dailyVerseHour, minute: dailyVerseMinute });
              }}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={dailyVerseEnabled ? colors.primary : colors.bg}
              disabled={busy}
            />
          </View>

          <SettingsRow
            title="Delivery time"
            subtitle={timeLabel}
            disabled={!dailyVerseEnabled || busy}
            onPress={() => setDailyPickerOpen(true)}
          />

          <View className="mt-5 flex-row gap-3">
            <Pressable
              className="flex-1 rounded-2xl bg-primary px-5 py-3 active:opacity-80"
              disabled={!dailyVerseEnabled || busy}
              onPress={async () => {
                await applyDailyVerseSchedule({ hour: dailyVerseHour, minute: dailyVerseMinute });
              }}
            >
              <Text className="text-center font-uiSemibold text-primaryForeground">
                {busy ? "Working..." : "Reschedule"}
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-2xl border border-border bg-bg px-5 py-3 active:opacity-80"
              disabled={busy}
              onPress={async () => {
                setBusy(true);
                try {
                  const ok = await ensurePermission();
                  if (!ok) {
                    Alert.alert("Permission needed", "Enable notifications to send a test.");
                    return;
                  }
                  await sendTestDailyVerseNotification({ translationId, appLanguage });
                } catch (e) {
                  Alert.alert("Test failed", e instanceof Error ? e.message : "Please try again.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Text className="text-center font-uiSemibold text-text">Send test</Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="font-uiSemibold text-base text-text">Prayer Alerts</Text>
              <Text className="mt-1 font-ui text-sm text-muted">
                Notify at Fajr, Dhuhr, Asr, Maghrib, and Isha.
              </Text>
            </View>
            <Switch
              value={prayerNotificationsEnabled}
              onValueChange={async (next) => {
                if (busy) return;
                setPrayerNotificationsEnabled(next);
                if (!next) {
                  setBusy(true);
                  try {
                    await cancelPrayerNotifications();
                  } finally {
                    setBusy(false);
                  }
                  return;
                }

                const ok = await ensurePermission();
                if (!ok) {
                  Alert.alert("Permission needed", "Enable notifications to receive prayer alerts.");
                  setPrayerNotificationsEnabled(false);
                  return;
                }

                setBusy(true);
                try {
                  const res = await applyPrayerSchedule({ notificationsEnabled: true });
                  Alert.alert("Scheduled", `Prayer alerts are set. (${res.scheduledCount} upcoming)`);
                } catch (e) {
                  Alert.alert("Scheduling failed", e instanceof Error ? e.message : "Please try again.");
                  setPrayerNotificationsEnabled(false);
                } finally {
                  setBusy(false);
                }
              }}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={prayerNotificationsEnabled ? colors.primary : colors.bg}
              disabled={busy}
            />
          </View>

          <View className="mt-5 flex-row items-center justify-between rounded-2xl border border-border bg-bg px-4 py-3">
            <View className="flex-1 pr-4">
              <Text className="font-uiMedium text-sm text-text">Adhan sound</Text>
              <Text className="mt-1 font-ui text-sm text-muted">
                Uses the selected notification sound when the prayer alert fires.
              </Text>
            </View>
            <Switch
              value={prayerAdhanEnabled}
              onValueChange={async (next) => {
                setPrayerAdhanEnabled(next);
                await updatePrayerScheduleAfterChange({ adhanEnabled: next });
              }}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={prayerAdhanEnabled ? colors.primary : colors.bg}
              disabled={busy}
            />
          </View>

          <SettingsRow
            title="Adhan audio"
            subtitle={optionLabel(PRAYER_ADHAN_SOUND_OPTIONS, prayerAdhanSound)}
            disabled={!prayerAdhanEnabled || busy}
            onPress={() =>
              openPrayerOptionPicker<PrayerAdhanSound>({
                title: "Adhan audio",
                subtitle: "One sound applies to all prayers in this version.",
                options: PRAYER_ADHAN_SOUND_OPTIONS,
                value: prayerAdhanSound,
                onSelect: async (value) => {
                  setPrayerAdhanSound(value);
                  await updatePrayerScheduleAfterChange({ adhanSound: value });
                },
              })
            }
          />

          <SettingsRow
            title="Calculation method"
            subtitle={optionLabel(PRAYER_CALCULATION_METHOD_OPTIONS, prayerCalculationMethod)}
            disabled={busy}
            onPress={() =>
              openPrayerOptionPicker<PrayerCalculationMethod>({
                title: "Calculation method",
                options: PRAYER_CALCULATION_METHOD_OPTIONS,
                value: prayerCalculationMethod,
                onSelect: async (value) => {
                  setPrayerCalculationMethod(value);
                  await updatePrayerScheduleAfterChange({ calculationMethod: value });
                },
              })
            }
          />

          <SettingsRow
            title="Madhab"
            subtitle={optionLabel(PRAYER_MADHAB_OPTIONS, prayerMadhab)}
            disabled={busy}
            onPress={() =>
              openPrayerOptionPicker<PrayerMadhab>({
                title: "Madhab",
                subtitle: "Controls the Asr calculation.",
                options: PRAYER_MADHAB_OPTIONS,
                value: prayerMadhab,
                onSelect: async (value) => {
                  setPrayerMadhab(value);
                  await updatePrayerScheduleAfterChange({ madhab: value });
                },
              })
            }
          />

          <SettingsRow
            title="Pre-prayer reminder"
            subtitle={optionLabel(PRAYER_REMINDER_OPTIONS, prayerReminderMinutes)}
            disabled={busy}
            onPress={() =>
              openPrayerOptionPicker<PrayerReminderMinutes>({
                title: "Pre-prayer reminder",
                options: PRAYER_REMINDER_OPTIONS,
                value: prayerReminderMinutes,
                onSelect: async (value) => {
                  setPrayerReminderMinutes(value);
                  await updatePrayerScheduleAfterChange({ reminderMinutes: value });
                },
              })
            }
          />

          <View className="mt-5">
            <Text className="font-uiMedium text-sm text-text">Location</Text>
            <Text className="mt-1 font-ui text-sm text-muted">
              Auto uses device location. Manual uses a saved city and country.
            </Text>

            <View className="mt-3 flex-row rounded-2xl border border-border bg-bg p-1">
              <Pressable
                className={`flex-1 rounded-xl px-3 py-2 active:opacity-80 ${
                  prayerLocationMode === "auto" ? "bg-primary" : "bg-transparent"
                }`}
                disabled={busy}
                onPress={async () => {
                  setPrayerLocationMode("auto");
                  if (prayerNotificationsEnabled) {
                    setBusy(true);
                    try {
                      const res = await applyPrayerSchedule({}, { locationMode: "auto" });
                      Alert.alert("Scheduled", `Prayer alerts are set. (${res.scheduledCount} upcoming)`);
                    } catch (e) {
                      Alert.alert("Scheduling failed", e instanceof Error ? e.message : "Please try again.");
                    } finally {
                      setBusy(false);
                    }
                  }
                }}
              >
                <Text
                  className={`text-center font-uiSemibold ${
                    prayerLocationMode === "auto" ? "text-primaryForeground" : "text-text"
                  }`}
                >
                  Auto
                </Text>
              </Pressable>
              <Pressable
                className={`flex-1 rounded-xl px-3 py-2 active:opacity-80 ${
                  prayerLocationMode === "manual" ? "bg-primary" : "bg-transparent"
                }`}
                disabled={busy}
                onPress={() => setPrayerLocationMode("manual")}
              >
                <Text
                  className={`text-center font-uiSemibold ${
                    prayerLocationMode === "manual" ? "text-primaryForeground" : "text-text"
                  }`}
                >
                  Manual
                </Text>
              </Pressable>
            </View>

            {prayerLocationMode === "manual" ? (
              <View className="mt-4 rounded-2xl border border-border bg-bg p-4">
                <Text className="font-uiMedium text-sm text-text">Manual city/country</Text>
                <Text className="mt-1 font-ui text-xs text-muted">Saved: {manualLocationLabel || "Not set"}</Text>

                <TextInput
                  className="mt-4 rounded-2xl border border-border bg-surface px-4 py-3 font-ui text-text"
                  placeholder="City"
                  placeholderTextColor={colors.muted}
                  value={manualCity}
                  onChangeText={setManualCity}
                  autoCapitalize="words"
                />
                <TextInput
                  className="mt-3 rounded-2xl border border-border bg-surface px-4 py-3 font-ui text-text"
                  placeholder="Country"
                  placeholderTextColor={colors.muted}
                  value={manualCountry}
                  onChangeText={setManualCountry}
                  autoCapitalize="words"
                />

                <Pressable
                  className="mt-4 rounded-2xl bg-primary px-5 py-3 active:opacity-80"
                  disabled={busy}
                  onPress={async () => {
                    setBusy(true);
                    try {
                      const found = await geocodeManualPrayerLocation(manualCity, manualCountry);
                      const city = manualCity.trim();
                      const country = manualCountry.trim();
                      setPrayerManualLocation({
                        city,
                        country,
                        latitude: found.coords.latitude,
                        longitude: found.coords.longitude,
                      });
                      setPrayerLocationMode("manual");

                      if (prayerNotificationsEnabled) {
                        const res = await schedulePrayerNotifications({
                          coords: found.coords,
                          place: found.place,
                          settings: buildPrayerScheduleSettings(),
                        });
                        Alert.alert("Saved", `Manual location saved. (${res.scheduledCount} upcoming alerts)`);
                      } else {
                        Alert.alert("Saved", "Manual prayer location saved.");
                      }
                    } catch (e) {
                      Alert.alert("Location not found", e instanceof Error ? e.message : "Please try again.");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Text className="text-center font-uiSemibold text-primaryForeground">
                    {busy ? "Checking..." : "Find and save location"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <View className="mt-5 flex-row gap-3">
            <Pressable
              className="flex-1 rounded-2xl bg-primary px-5 py-3 active:opacity-80"
              disabled={!prayerNotificationsEnabled || busy}
              onPress={async () => {
                setBusy(true);
                try {
                  const ok = await ensurePermission();
                  if (!ok) {
                    Alert.alert("Permission needed", "Enable notifications to schedule prayer alerts.");
                    return;
                  }
                  const res = await applyPrayerSchedule();
                  Alert.alert("Scheduled", `Prayer alerts are set. (${res.scheduledCount} upcoming)`);
                } catch (e) {
                  Alert.alert("Scheduling failed", e instanceof Error ? e.message : "Please try again.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Text className="text-center font-uiSemibold text-primaryForeground">
                {busy ? "Working..." : "Reschedule"}
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-2xl border border-border bg-bg px-5 py-3 active:opacity-80"
              disabled={busy}
              onPress={async () => {
                setBusy(true);
                try {
                  const ok = await ensurePermission();
                  if (!ok) {
                    Alert.alert("Permission needed", "Enable notifications to send a test.");
                    return;
                  }
                  await sendTestPrayerNotification({
                    appLanguage,
                    adhanEnabled: prayerAdhanEnabled,
                    adhanSound: prayerAdhanSound,
                  });
                } catch (e) {
                  Alert.alert("Test failed", e instanceof Error ? e.message : "Please try again.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Text className="text-center font-uiSemibold text-text">Send test</Text>
            </Pressable>
          </View>

          <Text className="mt-4 font-ui text-xs text-muted">
            We schedule the next 6 days to stay under iOS pending notification limits. Opening the app refreshes
            future prayer alerts.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={dailyPickerOpen} transparent animationType="fade" onRequestClose={() => setDailyPickerOpen(false)}>
        <Pressable className="flex-1 bg-black/40 px-6 py-16" onPress={() => setDailyPickerOpen(false)}>
          <Pressable style={{ maxHeight: 560 }} className="rounded-3xl border border-border bg-bg p-4" onPress={() => {}}>
            <View className="flex-row items-center justify-between">
              <Text className="font-uiSemibold text-base text-text">Choose time</Text>
              <Pressable
                className="h-9 w-9 items-center justify-center rounded-full bg-surface"
                onPress={() => setDailyPickerOpen(false)}
              >
                <MaterialCommunityIcons name="close" size={18} color={colors.text} />
              </Pressable>
            </View>

            <Text className="mt-1 font-ui text-sm text-muted">Current: {timeLabel}</Text>

            <ScrollView className="mt-4">
              {TIME_OPTIONS.map((t) => {
                const selected = t.hour === dailyVerseHour && t.minute === dailyVerseMinute;
                return (
                  <Pressable
                    key={`${t.hour}:${t.minute}`}
                    className={`flex-row items-center justify-between rounded-2xl px-4 py-3 active:opacity-80 ${
                      selected ? "bg-primaryMuted" : "bg-transparent"
                    }`}
                    onPress={async () => {
                      setDailyVerseTime(t.hour, t.minute);
                      setDailyPickerOpen(false);
                      if (dailyVerseEnabled) {
                        await applyDailyVerseSchedule({ hour: t.hour, minute: t.minute });
                      }
                    }}
                  >
                    <Text className="font-uiMedium text-sm text-text">{formatTime(t.hour, t.minute)}</Text>
                    {selected ? <MaterialCommunityIcons name="check" size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!picker} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <Pressable className="flex-1 bg-black/40 px-6 py-16" onPress={() => setPicker(null)}>
          <Pressable style={{ maxHeight: 560 }} className="rounded-3xl border border-border bg-bg p-4" onPress={() => {}}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="font-uiSemibold text-base text-text">{picker?.title}</Text>
                {picker?.subtitle ? <Text className="mt-1 font-ui text-sm text-muted">{picker.subtitle}</Text> : null}
              </View>
              <Pressable
                className="h-9 w-9 items-center justify-center rounded-full bg-surface"
                onPress={() => setPicker(null)}
              >
                <MaterialCommunityIcons name="close" size={18} color={colors.text} />
              </Pressable>
            </View>

            <View className="mt-4">
              {picker?.options.map((option) => (
                <Pressable
                  key={option.label}
                  className={`flex-row items-center justify-between rounded-2xl px-4 py-3 active:opacity-80 ${
                    option.selected ? "bg-primaryMuted" : "bg-transparent"
                  }`}
                  onPress={() => {
                    void option.onPress();
                  }}
                >
                  <Text className="font-uiMedium text-sm text-text">{option.label}</Text>
                  {option.selected ? <MaterialCommunityIcons name="check" size={18} color={colors.primary} /> : null}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
