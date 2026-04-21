import type { PropsWithChildren } from "react";
import type { ViewProps } from "react-native";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdBanner } from "@/components/AdBanner";
import { useSettingsStore } from "@/store/settingsStore";

type ScreenProps = PropsWithChildren<
  ViewProps & {
    avoidKeyboard?: boolean;
    backgroundColor?: string;
    padded?: boolean;
    showAd?: boolean;
  }
>;

export function Screen({
  avoidKeyboard = false,
  backgroundColor: backgroundColorOverride,
  children,
  padded = true,
  showAd = true,
  className,
  style,
  ...props
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useSettingsStore((s) => s.theme);
  const backgroundColor = theme === "dark" ? "#06130F" : theme === "sepia" ? "#F4E8D0" : "#FAF8F5";
  const screenBackgroundColor = backgroundColorOverride ?? backgroundColor;
  const Container = avoidKeyboard ? KeyboardAvoidingView : View;

  return (
    <Container
      {...(avoidKeyboard
        ? {
            behavior: Platform.OS === "ios" ? ("padding" as const) : ("height" as const),
            keyboardVerticalOffset: 0,
          }
        : {})}
      style={[{ flex: 1, paddingTop: insets.top, backgroundColor: screenBackgroundColor }, style]}
    >
      <View
        {...props}
        style={{ backgroundColor: screenBackgroundColor }}
        className={`flex-1 bg-bg ${className ?? ""}`}
      >
        <View className={`flex-1 ${padded ? "px-6" : ""}`}>{children}</View>
      </View>
      {showAd ? <AdBanner /> : null}
    </Container>
  );
}
