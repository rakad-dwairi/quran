import type { PropsWithChildren } from "react";
import type { ViewProps } from "react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenProps = PropsWithChildren<
  ViewProps & {
    padded?: boolean;
  }
>;

export function Screen({
  children,
  padded = true,
  className,
  style,
  ...props
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      {...props}
      style={[{ paddingTop: insets.top }, style]}
      className={`flex-1 bg-bg ${padded ? "px-6" : ""} ${className ?? ""}`}
    >
      {children}
    </View>
  );
}

