import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";

export default function AiTabScreen() {
  return (
    <Screen className="pt-6">
      <AppHeader title="AI" subtitle="Tafsir and simplified explanations." />

      <View className="mt-2 rounded-2xl border border-border bg-surface px-4 py-5">
        <Text className="font-uiSemibold text-base text-text">AI Tafsir</Text>
        <Text className="mt-2 font-ui text-sm text-muted">
          Open a Surah and tap the Tafsir icon on any verse to see tafsir and generate an AI summary.
        </Text>

        <View className="mt-4 gap-3">
          <Pressable
            className="rounded-2xl bg-primary px-5 py-3 active:opacity-80"
            onPress={() => router.push("/quran")}
          >
            <Text className="text-center font-uiSemibold text-white">Go to Quran</Text>
          </Pressable>

          <Pressable
            className="rounded-2xl border border-border bg-bg px-5 py-3 active:opacity-80"
            onPress={() => router.push("/search")}
          >
            <Text className="text-center font-uiSemibold text-text">Search for a verse</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

