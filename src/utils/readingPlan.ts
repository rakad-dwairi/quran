export type ReadingPlanPaceStatus = "ahead" | "onTrack" | "behind";

export type ReadingPlanPace = {
  expectedCompletedDays: number;
  deltaDays: number;
  status: ReadingPlanPaceStatus;
  catchUpDays: number;
};

export type ReadingPlanWeeklyReview = {
  completedDaysThisWeek: number;
  missedDaysThisWeek: number;
  weeklyTargetDays: number;
  suggestedCatchUpDays: number;
};

export type ReadingMilestoneMeta = {
  id: "streak3" | "streak7" | "streak30" | "planFirstComplete" | "perfectWeek";
};

export const READING_MILESTONES: ReadingMilestoneMeta[] = [
  { id: "streak3" },
  { id: "streak7" },
  { id: "streak30" },
  { id: "planFirstComplete" },
  { id: "perfectWeek" },
];

export function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(dayKey: string, days: number) {
  const date = new Date(`${dayKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDayKey(date);
}

export function getReadingPlanPace({
  enabled,
  startDate,
  completedDays,
  durationDays,
  now = new Date(),
}: {
  enabled: boolean;
  startDate: string | null;
  completedDays: number;
  durationDays: number;
  now?: Date;
}): ReadingPlanPace | null {
  if (!enabled || !startDate) return null;

  const todayKey = toDayKey(now);
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const today = new Date(`${todayKey}T00:00:00.000Z`);
  const elapsedRaw = Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1;
  const elapsedDays = Math.max(1, elapsedRaw);
  const expectedCompletedDays = Math.min(durationDays, elapsedDays);
  const deltaDays = completedDays - expectedCompletedDays;
  const catchUpDays = Math.max(0, expectedCompletedDays - completedDays);
  const status: ReadingPlanPaceStatus = deltaDays > 0 ? "ahead" : deltaDays < 0 ? "behind" : "onTrack";

  return {
    expectedCompletedDays,
    deltaDays,
    status,
    catchUpDays,
  };
}

export function getReadingPlanWeeklyReview({
  enabled,
  activityDays,
  now = new Date(),
  weeklyTargetDays = 7,
}: {
  enabled: boolean;
  activityDays: string[];
  now?: Date;
  weeklyTargetDays?: number;
}): ReadingPlanWeeklyReview | null {
  if (!enabled) return null;
  const target = Math.max(1, Math.min(7, weeklyTargetDays));
  const activitySet = new Set(activityDays);
  const todayKey = toDayKey(now);
  let completed = 0;
  for (let i = 0; i < 7; i++) {
    const dayKey = addDays(todayKey, -i);
    if (activitySet.has(dayKey)) completed += 1;
  }
  const missed = Math.max(0, 7 - completed);
  const suggestedCatchUpDays = Math.max(0, target - completed);

  return {
    completedDaysThisWeek: completed,
    missedDaysThisWeek: missed,
    weeklyTargetDays: target,
    suggestedCatchUpDays,
  };
}
