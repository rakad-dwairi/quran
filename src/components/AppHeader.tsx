import { router } from "expo-router";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { IconButton } from "@/components/IconButton";
import { colors } from "@/theme/colors";

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  right,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: ReactNode;
}) {
  return (
    <View className="pb-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          {showBack ? (
            <IconButton
              name="chevron-left"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              color={colors.text}
              className="-ml-2"
            />
          ) : null}
          <View>
            <Text className="font-uiSemibold text-2xl text-text">{title}</Text>
            {subtitle ? (
              <Text className="mt-0.5 font-ui text-sm text-muted">{subtitle}</Text>
            ) : null}
          </View>
        </View>

        {right ? <View className="flex-row items-center">{right}</View> : null}
      </View>
    </View>
  );
}

