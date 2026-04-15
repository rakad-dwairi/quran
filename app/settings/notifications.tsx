import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import {
  cancelDailyVerseNotifications,
  scheduleDailyVerseNotifications,
  sendTestDailyVerseNotification,
} from "@/services/dailyVerseNotifications";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";

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
  const req = await Notifications.requestPermissionsAsync();
  return req.status === "granted";
}

export default function NotificationsSettingsScreen() {
  const {
    translationId,
    dailyVerseEnabled,
    dailyVerseHour,
    dailyVerseMinute,
    setDailyVerseEnabled,
    setDailyVerseTime,
  } = useSettingsStore();

  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const timeLabel = useMemo(() => formatTime(dailyVerseHour, dailyVerseMinute), [dailyVerseHour, dailyVerseMinute]);

  async function applySchedule({ hour, minute }: { hour: number; minute: number }) {
    setBusy(true);
    try {
      const res = await scheduleDailyVerseNotifications({ hour, minute, translationId, daysAhead: 14 });
      Alert.alert("Scheduled", `Daily verse notifications are set. (${res.scheduledCount} upcoming notifications)`);
    } catch (e) {
      Alert.alert("Scheduling failed", e instanceof Error ? e.message : "Please try again.");
      setDailyVerseEnabled(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen className="pt-6">
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader title="Notifications" subtitle="Daily reminders and verses." showBack />

      <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="font-uiSemibold text-base text-text">Daily verse</Text>
            <Text className="mt-1 font-ui text-sm text-muted">
              Receive a verse of the day as a notification.
            </Text>
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

              await applySchedule({ hour: dailyVerseHour, minute: dailyVerseMinute });
            }}
            trackColor={{ false: colors.border, true: colors.primaryMuted }}
            thumbColor={dailyVerseEnabled ? colors.primary : colors.bg}
            disabled={busy}
          />
        </View>

        <Pressable
          className={`mt-5 flex-row items-center justify-between rounded-2xl border border-border px-4 py-3 active:opacity-80 ${
            dailyVerseEnabled ? "bg-bg" : "bg-mutedBg"
          }`}
          disabled={!dailyVerseEnabled || busy}
          onPress={() => setPickerOpen(true)}
        >
          <View>
            <Text className="font-uiMedium text-sm text-text">Delivery time</Text>
            <Text className="mt-0.5 font-ui text-sm text-muted">{timeLabel}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
        </Pressable>

        <View className="mt-5 flex-row gap-3">
          <Pressable
            className="flex-1 rounded-2xl bg-primary px-5 py-3 active:opacity-80"
            disabled={!dailyVerseEnabled || busy}
            onPress={async () => {
              await applySchedule({ hour: dailyVerseHour, minute: dailyVerseMinute });
            }}
          >
            <Text className="text-center font-uiSemibold text-primaryForeground">
              {busy ? "Working…" : "Reschedule"}
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
                await sendTestDailyVerseNotification({ translationId });
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
          Tip: We schedule the next 14 days. Open the app occasionally so it can refresh future notifications.
        </Text>
      </View>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable className="flex-1 bg-black/40 px-6 py-16" onPress={() => setPickerOpen(false)}>
          <Pressable style={{ maxHeight: 560 }} className="rounded-3xl border border-border bg-bg p-4" onPress={() => {}}>
            <View className="flex-row items-center justify-between">
              <Text className="font-uiSemibold text-base text-text">Choose time</Text>
              <Pressable
                className="h-9 w-9 items-center justify-center rounded-full bg-surface"
                onPress={() => setPickerOpen(false)}
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
                      setPickerOpen(false);
                      if (dailyVerseEnabled) {
                        await applySchedule({ hour: t.hour, minute: t.minute });
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
    </Screen>
  );
}

