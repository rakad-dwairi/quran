import { Pressable, Text, type PressableProps } from "react-native";

type ActionButtonProps = PressableProps & {
  label: string;
  variant?: "primary" | "secondary" | "danger";
};

export function ActionButton({
  label,
  variant = "primary",
  className,
  disabled,
  ...props
}: ActionButtonProps) {
  const palette =
    variant === "primary"
      ? "bg-primary text-primaryForeground"
      : variant === "danger"
      ? "bg-danger text-dangerForeground"
      : "bg-bg text-text border border-border";

  return (
    <Pressable
      {...props}
      disabled={disabled}
      className={`min-h-12 items-center justify-center rounded-2xl px-4 py-3 active:opacity-80 ${
        disabled ? "opacity-60" : ""
      } ${palette} ${className ?? ""}`}
    >
      <Text
        className={`font-uiSemibold text-sm ${
          variant === "primary"
            ? "text-primaryForeground"
            : variant === "danger"
            ? "text-dangerForeground"
            : "text-text"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
