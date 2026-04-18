import type { PropsWithChildren } from "react";
import { View, type ViewProps } from "react-native";

type SectionCardProps = PropsWithChildren<
  ViewProps & {
    compact?: boolean;
  }
>;

export function SectionCard({
  children,
  compact = false,
  className,
  ...props
}: SectionCardProps) {
  return (
    <View
      {...props}
      className={`overflow-hidden rounded-3xl border border-border bg-surface ${
        compact ? "px-4 py-4" : "px-5 py-5"
      } ${className ?? ""}`}
    >
      <View className="absolute left-0 top-0 h-full w-1 bg-accent" />
      {children}
    </View>
  );
}
