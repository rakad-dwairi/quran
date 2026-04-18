import type { PropsWithChildren } from "react";
import type { ViewProps } from "react-native";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdBanner } from "@/components/AdBanner";

type ScreenProps = PropsWithChildren<
  ViewProps & {
    padded?: boolean;
    showAd?: boolean;
  }
>;

export function Screen({
  children,
  padded = true,
  showAd = true,
  className,
  style,
  ...props
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
      style={[{ flex: 1, paddingTop: insets.top }, style]}
    >
      <View
        {...props}
        className={`flex-1 bg-bg ${className ?? ""}`}
      >
        <View className={`flex-1 ${padded ? "px-6" : ""}`}>{children}</View>
      </View>
      {showAd ? <AdBanner /> : null}
    </KeyboardAvoidingView>
  );
}
