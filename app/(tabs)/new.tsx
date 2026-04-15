import { Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";

export default function NewTabScreen() {
  return (
    <Screen className="pt-6">
      <AppHeader title="New" subtitle="Updates near you (coming soon)." />

      <View className="mt-2 rounded-2xl border border-border bg-surface px-4 py-6">
        <Text className="font-uiSemibold text-base text-text">Nothing yet</Text>
        <Text className="mt-2 font-ui text-sm text-muted">
          This tab will show Islamic updates and nearby events based on your location.
        </Text>
      </View>
    </Screen>
  );
}

