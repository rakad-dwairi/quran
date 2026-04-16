import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { ActionButton } from "@/components/ActionButton";
import { SectionCard } from "@/components/SectionCard";
import { colors } from "@/theme/colors";

export function EmptyState({
  icon = "leaf",
  title,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
}: {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}) {
  return (
    <SectionCard className="items-start">
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primaryMuted">
        <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      </View>
      <Text className="mt-4 font-uiSemibold text-base text-text">{title}</Text>
      <Text className="mt-2 font-ui text-sm leading-6 text-muted">{body}</Text>

      {actionLabel && onAction ? (
        <View className="mt-5 w-full gap-3">
          <ActionButton label={actionLabel} onPress={onAction} />
          {secondaryLabel && onSecondaryAction ? (
            <ActionButton label={secondaryLabel} variant="secondary" onPress={onSecondaryAction} />
          ) : null}
        </View>
      ) : null}
    </SectionCard>
  );
}
