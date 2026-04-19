import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { ActionButton } from "@/components/ActionButton";
import { AppHeader } from "@/components/AppHeader";
import { ReadingWeekStrip } from "@/components/ReadingWeekStrip";
import { Screen } from "@/components/Screen";
import { useAppLocale } from "@/i18n/useAppLocale";
import {
  cancelReadingPlanNotifications,
  scheduleReadingPlanNotifications,
  sendTestReadingPlanNotification,
} from "@/services/readingPlanNotifications";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";
import {
  addDays,
  getReadingPlanPace,
  getReadingPlanWeeklyReview,
  READING_MILESTONES,
  toDayKey,
} from "@/utils/readingPlan";
import { confirmNotificationPermission } from "@/utils/permissionPrompts";

const MINUTES = [0, 30] as const;
const TIME_OPTIONS = Array.from({ length: 24 }).flatMap((_, hour) => MINUTES.map((minute) => ({ hour, minute })));

function formatTime(hour: number, minute: number) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

async function ensurePermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;
  const shouldAsk = await confirmNotificationPermission();
  if (!shouldAsk) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === "granted";
}

export default function ReadingPlanSettingsScreen() {
  const { t } = useAppLocale();
  const {
    appLanguage,
    readingPlanEnabled,
    readingPlanDurationDays,
    readingPlanStartDate,
    readingPlanCompletedDays,
    readingPlanReminderEnabled,
    readingPlanReminderHour,
    readingPlanReminderMinute,
    startReadingPlan,
    stopReadingPlan,
    setReadingPlanDuration,
    setReadingPlanReminderEnabled,
    setReadingPlanReminderTime,
    markReadingDayComplete,
    readingStreakDate,
    readingActivityDays,
    milestonesUnlockedAt,
    readingPlanHistory,
  } = useSettingsStore(
    useShallow((state) => ({
      appLanguage: state.appLanguage,
      readingPlanEnabled: state.readingPlanEnabled,
      readingPlanDurationDays: state.readingPlanDurationDays,
      readingPlanStartDate: state.readingPlanStartDate,
      readingPlanCompletedDays: state.readingPlanCompletedDays,
      readingPlanReminderEnabled: state.readingPlanReminderEnabled,
      readingPlanReminderHour: state.readingPlanReminderHour,
      readingPlanReminderMinute: state.readingPlanReminderMinute,
      startReadingPlan: state.startReadingPlan,
      stopReadingPlan: state.stopReadingPlan,
      setReadingPlanDuration: state.setReadingPlanDuration,
      setReadingPlanReminderEnabled: state.setReadingPlanReminderEnabled,
      setReadingPlanReminderTime: state.setReadingPlanReminderTime,
      markReadingDayComplete: state.markReadingDayComplete,
      readingStreakDate: state.readingStreakDate,
      readingActivityDays: state.readingActivityDays,
      milestonesUnlockedAt: state.milestonesUnlockedAt,
      readingPlanHistory: state.readingPlanHistory,
    }))
  );

  const [busy, setBusy] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const progressPercent = Math.min(100, Math.round((readingPlanCompletedDays / Math.max(1, readingPlanDurationDays)) * 100));
  const finishDate = readingPlanStartDate ? addDays(readingPlanStartDate, readingPlanDurationDays - 1) : null;
  const readingPlanPace = getReadingPlanPace({
    enabled: readingPlanEnabled,
    startDate: readingPlanStartDate,
    completedDays: readingPlanCompletedDays,
    durationDays: readingPlanDurationDays,
  });
  const paceLabel =
    readingPlanPace?.status === "ahead"
      ? t("readingPlan.paceAhead", { count: readingPlanPace.deltaDays })
      : readingPlanPace?.status === "behind"
      ? t("readingPlan.paceBehind", { count: readingPlanPace.catchUpDays })
      : readingPlanPace?.status === "onTrack"
      ? t("readingPlan.paceOnTrack")
      : null;
  const todayTargetLabel = readingPlanPace
    ? t("readingPlan.byToday", {
        expected: readingPlanPace.expectedCompletedDays,
        duration: readingPlanDurationDays,
      })
    : null;
  const completedToday = readingStreakDate === toDayKey(new Date());
  const weeklyReview = getReadingPlanWeeklyReview({
    enabled: readingPlanEnabled,
    activityDays: readingActivityDays,
    weeklyTargetDays: 7,
  });
  const unlockedMilestones = READING_MILESTONES.filter((m) => Boolean(milestonesUnlockedAt[m.id]));
  const recentPlanHistory = readingPlanHistory.slice(0, 5);
  const milestoneLabelById: Record<(typeof READING_MILESTONES)[number]["id"], string> = {
    streak3: t("readingPlan.milestones.streak3"),
    streak7: t("readingPlan.milestones.streak7"),
    streak30: t("readingPlan.milestones.streak30"),
    planFirstComplete: t("readingPlan.milestones.planFirstComplete"),
    perfectWeek: t("readingPlan.milestones.perfectWeek"),
  };
  const reminderTimeLabel = useMemo(
    () => formatTime(readingPlanReminderHour, readingPlanReminderMinute),
    [readingPlanReminderHour, readingPlanReminderMinute]
  );

  async function rescheduleReminder(hour = readingPlanReminderHour, minute = readingPlanReminderMinute) {
    if (!readingPlanEnabled || !readingPlanReminderEnabled) return;
    await scheduleReadingPlanNotifications({ hour, minute, appLanguage, daysAhead: 14 });
  }

  return (
    <Screen className="pt-6" padded={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="px-6">
        <AppHeader title={t("readingPlan.title")} subtitle={t("readingPlan.subtitle")} showBack />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-uiSemibold text-base text-text">{t("readingPlan.planStatusTitle")}</Text>
            <Text className="font-ui text-sm text-muted">
              {readingPlanEnabled ? t("readingPlan.active") : t("readingPlan.inactive")}
            </Text>
          </View>
          <Text className="mt-2 font-ui text-sm leading-6 text-muted">
            {readingPlanEnabled
              ? t("readingPlan.progressSummary", {
                  completed: readingPlanCompletedDays,
                  duration: readingPlanDurationDays,
                  percent: progressPercent,
                })
              : t("readingPlan.startPrompt")}
          </Text>
          {finishDate ? (
            <Text className="mt-1 font-ui text-xs text-muted">{t("readingPlan.expectedFinish", { date: finishDate })}</Text>
          ) : null}
          {todayTargetLabel ? <Text className="mt-1 font-ui text-xs text-muted">{todayTargetLabel}</Text> : null}
          {paceLabel ? <Text className="mt-1 font-ui text-xs text-muted">{t("readingPlan.paceLabel", { pace: paceLabel })}</Text> : null}
          {readingPlanPace?.status === "behind" ? (
            <Text className="mt-1 font-ui text-xs text-muted">
              {t("readingPlan.catchUpSuggestion", { count: readingPlanPace.catchUpDays })}
            </Text>
          ) : null}

          <View className="mt-4 flex-row gap-3">
            <ActionButton
              label={t("readingPlan.durationLabel", { days: readingPlanDurationDays })}
              variant="secondary"
              className="flex-1"
              onPress={() => {
                const next = readingPlanDurationDays === 30 ? 60 : readingPlanDurationDays === 60 ? 90 : 30;
                setReadingPlanDuration(next);
              }}
            />
            <ActionButton
              label={
                readingPlanEnabled
                  ? completedToday
                    ? t("readingPlan.completedToday")
                    : t("readingPlan.markTodayComplete")
                  : t("readingPlan.startPlan")
              }
              className="flex-1"
              onPress={() => {
                if (readingPlanEnabled) {
                  if (completedToday) return;
                  markReadingDayComplete();
                  return;
                }
                startReadingPlan({ durationDays: readingPlanDurationDays });
              }}
            />
          </View>
          {readingPlanEnabled ? (
            <View className="mt-3">
              <ActionButton label={t("readingPlan.resetPlan")} variant="secondary" onPress={() => stopReadingPlan()} />
            </View>
          ) : null}
        </View>

        {readingPlanEnabled && weeklyReview ? (
          <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
            <View className="flex-row items-center justify-between">
            <Text className="font-uiSemibold text-base text-text">{t("readingPlan.weeklyReviewTitle")}</Text>
              <Text className="font-ui text-sm text-muted">{weeklyReview.completedDaysThisWeek}/7</Text>
            </View>
            <Text className="mt-2 font-ui text-sm leading-6 text-muted">
              {t("readingPlan.weeklyReviewSummary", {
                completed: weeklyReview.completedDaysThisWeek,
                missed: weeklyReview.missedDaysThisWeek,
              })}
            </Text>
            <ReadingWeekStrip activityDays={readingActivityDays} />
            <Text className="mt-1 font-ui text-xs text-muted">
              {t("readingPlan.weeklyTargetPrefix", { days: weeklyReview.weeklyTargetDays })}
              {weeklyReview.suggestedCatchUpDays > 0
                ? t("readingPlan.weeklyCatchUpSuffix", { count: weeklyReview.suggestedCatchUpDays })
                : t("readingPlan.weeklyOnTargetSuffix")}
            </Text>
          </View>
        ) : null}

        <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-uiSemibold text-base text-text">{t("readingPlan.milestonesTitle")}</Text>
            <Text className="font-ui text-sm text-muted">
              {unlockedMilestones.length}/{READING_MILESTONES.length}
            </Text>
          </View>
          {unlockedMilestones.length > 0 ? (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {unlockedMilestones.map((milestone) => (
                <View key={milestone.id} className="rounded-full border border-border bg-bg px-3 py-1.5">
                  <Text className="font-ui text-xs text-text">{milestoneLabelById[milestone.id]}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="mt-2 font-ui text-sm text-muted">{t("readingPlan.milestonesEmpty")}</Text>
          )}
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-uiSemibold text-base text-text">{t("readingPlan.planHistoryTitle")}</Text>
            <Text className="font-ui text-sm text-muted">{readingPlanHistory.length}</Text>
          </View>
          {recentPlanHistory.length > 0 ? (
            <View className="mt-3 gap-2">
              {recentPlanHistory.map((item) => (
                <View key={item.id} className="rounded-2xl border border-border bg-bg px-3 py-2">
                  <Text className="font-uiMedium text-xs text-text">
                    {t("readingPlan.planHistoryEntry", {
                      completed: item.completedDays,
                      duration: item.durationDays,
                      status: item.completed ? t("readingPlan.statusCompleted") : t("readingPlan.statusRecorded"),
                    })}
                  </Text>
                  <Text className="mt-0.5 font-ui text-xs text-muted">
                    {item.startDate ?? "unknown"} {"->"} {item.endDate}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="mt-2 font-ui text-sm text-muted">{t("readingPlan.planHistoryEmpty")}</Text>
          )}
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="font-uiSemibold text-base text-text">{t("readingPlan.dailyReminderTitle")}</Text>
              <Text className="mt-1 font-ui text-sm text-muted">
                {t("readingPlan.dailyReminderBody")}
              </Text>
            </View>
            <Switch
              value={readingPlanReminderEnabled}
              onValueChange={async (next) => {
                if (busy) return;
                setReadingPlanReminderEnabled(next);
                if (!next) {
                  setBusy(true);
                  try {
                    await cancelReadingPlanNotifications();
                  } finally {
                    setBusy(false);
                  }
                  return;
                }
                if (!readingPlanEnabled) {
                  Alert.alert(t("readingPlan.alertStartPlanTitle"), t("readingPlan.alertStartPlanBody"));
                  setReadingPlanReminderEnabled(false);
                  return;
                }
                const ok = await ensurePermission();
                if (!ok) {
                  Alert.alert(t("readingPlan.alertPermissionTitle"), t("readingPlan.alertPermissionBody"));
                  setReadingPlanReminderEnabled(false);
                  return;
                }
                setBusy(true);
                try {
                  const res = await scheduleReadingPlanNotifications({
                    hour: readingPlanReminderHour,
                    minute: readingPlanReminderMinute,
                    appLanguage,
                    daysAhead: 14,
                  });
                  Alert.alert(t("readingPlan.alertScheduledTitle"), t("readingPlan.alertScheduledBody", { count: res.scheduledCount }));
                } catch (e) {
                  Alert.alert(t("readingPlan.alertSchedulingFailedTitle"), e instanceof Error ? e.message : t("readingPlan.alertTryAgain"));
                  setReadingPlanReminderEnabled(false);
                } finally {
                  setBusy(false);
                }
              }}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={readingPlanReminderEnabled ? colors.primary : colors.bg}
              disabled={busy}
            />
          </View>

          <Pressable
            className={`mt-3 flex-row items-center justify-between rounded-2xl border border-border px-4 py-3 ${
              !readingPlanReminderEnabled || busy ? "bg-mutedBg opacity-60" : "bg-bg"
            }`}
            disabled={!readingPlanReminderEnabled || busy}
            onPress={() => setTimePickerOpen(true)}
          >
            <View className="flex-1 pr-4">
              <Text className="font-uiMedium text-sm text-text">{t("readingPlan.reminderTimeTitle")}</Text>
              <Text className="mt-0.5 font-ui text-sm text-muted">{reminderTimeLabel}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
          </Pressable>

          <View className="mt-5 flex-row gap-3">
            <Pressable
              className="flex-1 rounded-2xl bg-primary px-5 py-3 active:opacity-80"
              disabled={!readingPlanEnabled || !readingPlanReminderEnabled || busy}
              onPress={async () => {
                setBusy(true);
                try {
                  const ok = await ensurePermission();
                  if (!ok) {
                    Alert.alert(t("readingPlan.alertPermissionTitle"), t("readingPlan.alertPermissionScheduleBody"));
                    return;
                  }
                  const res = await scheduleReadingPlanNotifications({
                    hour: readingPlanReminderHour,
                    minute: readingPlanReminderMinute,
                    appLanguage,
                    daysAhead: 14,
                  });
                  Alert.alert(t("readingPlan.alertScheduledTitle"), t("readingPlan.alertScheduledBody", { count: res.scheduledCount }));
                } catch (e) {
                  Alert.alert(t("readingPlan.alertSchedulingFailedTitle"), e instanceof Error ? e.message : t("readingPlan.alertTryAgain"));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Text className="text-center font-uiSemibold text-primaryForeground">
                {busy ? t("readingPlan.working") : t("readingPlan.reschedule")}
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
                    Alert.alert(t("readingPlan.alertPermissionTitle"), t("readingPlan.alertPermissionTestBody"));
                    return;
                  }
                  await sendTestReadingPlanNotification({ appLanguage });
                } catch (e) {
                  Alert.alert(t("readingPlan.alertTestFailedTitle"), e instanceof Error ? e.message : t("readingPlan.alertTryAgain"));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Text className="text-center font-uiSemibold text-text">{t("readingPlan.sendTest")}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal visible={timePickerOpen} transparent animationType="fade" onRequestClose={() => setTimePickerOpen(false)}>
        <Pressable className="flex-1 bg-black/40 px-6 py-16" onPress={() => setTimePickerOpen(false)}>
          <Pressable style={{ maxHeight: 560 }} className="rounded-3xl border border-border bg-bg p-4" onPress={() => {}}>
            <View className="flex-row items-center justify-between">
              <Text className="font-uiSemibold text-base text-text">{t("readingPlan.chooseReminderTime")}</Text>
              <Pressable
                className="h-9 w-9 items-center justify-center rounded-full bg-surface"
                onPress={() => setTimePickerOpen(false)}
              >
                <MaterialCommunityIcons name="close" size={18} color={colors.text} />
              </Pressable>
            </View>

            <Text className="mt-1 font-ui text-sm text-muted">{t("readingPlan.currentTime", { time: reminderTimeLabel })}</Text>

            <ScrollView className="mt-4">
              {TIME_OPTIONS.map((timeOption) => {
                const selected =
                  timeOption.hour === readingPlanReminderHour && timeOption.minute === readingPlanReminderMinute;
                return (
                  <Pressable
                    key={`${timeOption.hour}:${timeOption.minute}`}
                    className={`flex-row items-center justify-between rounded-2xl px-4 py-3 active:opacity-80 ${
                      selected ? "bg-primaryMuted" : "bg-transparent"
                    }`}
                    onPress={async () => {
                      setReadingPlanReminderTime(timeOption.hour, timeOption.minute);
                      setTimePickerOpen(false);
                      setBusy(true);
                      try {
                        await rescheduleReminder(timeOption.hour, timeOption.minute);
                      } catch (e) {
                        Alert.alert(t("readingPlan.alertSchedulingFailedTitle"), e instanceof Error ? e.message : t("readingPlan.alertTryAgain"));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <Text className="font-uiMedium text-sm text-text">{formatTime(timeOption.hour, timeOption.minute)}</Text>
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
