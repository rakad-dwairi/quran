import { Text, View } from "react-native";

export function StatusBadge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "primary" | "accent" | "success";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primaryMuted text-primary"
      : tone === "accent"
      ? "bg-secondary text-accentForeground"
      : tone === "success"
      ? "bg-mutedBg text-text"
      : "bg-bg text-muted";

  return (
    <View className={`rounded-full px-3 py-1 ${toneClass.split(" ")[0]}`}>
      <Text className={`font-uiMedium text-xs ${toneClass.split(" ")[1]}`}>{label}</Text>
    </View>
  );
}
