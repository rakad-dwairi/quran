import { createContext, useCallback, useContext, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";

type ToastTone = "success" | "error" | "info";

type ToastMessage = {
  id: number;
  title: string;
  body?: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: Omit<ToastMessage, "id">) => void;
};

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

function toneStyles(tone: ToastTone) {
  if (tone === "success") return { borderColor: colors.primary, accent: colors.primary };
  if (tone === "error") return { borderColor: colors.danger, accent: colors.danger };
  return { borderColor: colors.accent, accent: colors.accent };
}

export function ToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: Omit<ToastMessage, "id">) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ ...message, id: Date.now() });
    timeoutRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);
  const styles = toast ? toneStyles(toast.tone) : null;

  return (
    <ToastContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {toast && styles ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss message"
            className="absolute left-5 right-5 rounded-2xl border bg-bg px-4 py-4 shadow-sm"
            style={{ top: Math.max(12, insets.top + 12), borderColor: styles.borderColor }}
            onPress={() => setToast(null)}
          >
            <View className="flex-row items-start">
              <View className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: styles.accent }} />
              <View className="ml-3 flex-1">
                <Text className="font-uiSemibold text-sm text-text">{toast.title}</Text>
                {toast.body ? <Text className="mt-1 font-ui text-xs leading-5 text-muted">{toast.body}</Text> : null}
              </View>
            </View>
          </Pressable>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
