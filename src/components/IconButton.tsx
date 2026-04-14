import type { ComponentProps } from "react";
import { Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  color = "#0F172A",
  size = 22,
  className,
}: {
  name: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className={`h-10 w-10 items-center justify-center rounded-full active:opacity-70 ${className ?? ""}`}
      hitSlop={10}
    >
      <MaterialCommunityIcons name={name} size={size} color={color} />
    </Pressable>
  );
}

