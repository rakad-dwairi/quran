import { router } from "expo-router";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { IconButton } from "@/components/IconButton";
import { useAppLocale } from "@/i18n/useAppLocale";
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
  const { t, isRTL } = useAppLocale();

  return (
    <View className="pb-4">
      <View className={`items-center justify-between ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
        <View className={`items-center ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
          {showBack ? (
            <IconButton
              name={isRTL ? "chevron-right" : "chevron-left"}
              accessibilityLabel={t("common.back")}
              onPress={() => router.back()}
              color={colors.text}
              className={isRTL ? "-mr-2" : "-ml-2"}
            />
          ) : null}
          <View>
            <Text className="font-uiSemibold text-2xl text-text" style={{ textAlign: isRTL ? "right" : "left" }}>
              {title}
            </Text>
            {subtitle ? (
              <Text className="mt-0.5 font-ui text-sm text-muted" style={{ textAlign: isRTL ? "right" : "left" }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {right ? <View className={`items-center ${isRTL ? "flex-row-reverse" : "flex-row"}`}>{right}</View> : null}
      </View>
    </View>
  );
}
