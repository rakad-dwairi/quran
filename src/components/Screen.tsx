import type { PropsWithChildren } from "react";
import type { ViewProps } from "react-native";
import { View } from "react-native";
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
    <View
      {...props}
      style={[{ paddingTop: insets.top }, style]}
      className={`flex-1 bg-bg ${className ?? ""}`}
    >
      <View className={`flex-1 ${padded ? "px-6" : ""}`}>{children}</View>
      {showAd ? <AdBanner /> : null}
    </View>
  );
}
