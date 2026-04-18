import { router } from "expo-router";
import type { ReactNode } from "react";
import { Image, Text, View } from "react-native";
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
  const { t, isRTL, rowDirection, textAlign } = useAppLocale();

  return (
    <View className="pb-6">
      <View className="items-center justify-between" style={{ flexDirection: rowDirection }}>
        <View className="min-w-0 flex-1 items-center" style={{ flexDirection: rowDirection }}>
          {showBack ? (
            <IconButton
              name={isRTL ? "chevron-right" : "chevron-left"}
              accessibilityLabel={t("common.back")}
              onPress={() => router.back()}
              color={colors.text}
              className={isRTL ? "-mr-2" : "-ml-2"}
            />
          ) : (
            <View
              className="h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface"
              style={{ marginEnd: 12 }}
            >
              <Image
                source={require("../../assets/logo-mark.png")}
                className="h-12 w-12"
                resizeMode="cover"
              />
            </View>
          )}
          <View className="min-w-0 flex-1">
            <View className="items-center" style={{ flexDirection: rowDirection }}>
              <Text className="font-uiSemibold text-[28px] text-text" style={{ textAlign }}>
                {title}
              </Text>
              {!showBack ? <Text className="ml-2 font-uiSemibold text-lg text-accent">✦</Text> : null}
            </View>
            {subtitle ? (
              <Text className="mt-1 font-ui text-sm leading-6 text-muted" style={{ textAlign }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {right ? <View className="items-center" style={{ flexDirection: rowDirection }}>{right}</View> : null}
      </View>
    </View>
  );
}
