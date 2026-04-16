import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { colors } from "@/theme/colors";

const PHRASES = [
  "SubhanAllah",
  "Alhamdulillah",
  "Allahu Akbar",
  "La ilaha illa Allah",
] as const;

export default function TasbihScreen() {
  const [count, setCount] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);

  const phrase = PHRASES[phraseIndex] ?? PHRASES[0];

  return (
    <Screen className="pt-6">
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader title="Tasbih" subtitle="Simple dhikr counter." showBack />

      <View className="mt-4 rounded-2xl border border-border bg-surface p-5">
        <Text className="font-ui text-sm text-muted">Current dhikr</Text>
        <Text className="mt-2 font-uiSemibold text-2xl text-text">{phrase}</Text>

        <View className="mt-5 items-center rounded-2xl bg-bg px-4 py-8">
          <Text className="font-ui text-sm text-muted">Count</Text>
          <Text className="mt-2 font-uiSemibold text-5xl text-primary">{count}</Text>
        </View>

        <Pressable
          className="mt-5 items-center rounded-2xl bg-primary px-4 py-4 active:opacity-80"
          onPress={() => setCount((current) => current + 1)}
        >
          <MaterialCommunityIcons name="gesture-tap-button" size={24} color={colors.primaryForeground} />
          <Text className="mt-2 font-uiSemibold text-base text-primaryForeground">Tap to count</Text>
        </Pressable>

        <View className="mt-4 flex-row gap-3">
          <Pressable
            className="flex-1 rounded-lg border border-border bg-bg px-4 py-3 active:opacity-80"
            onPress={() => setCount(0)}
          >
            <Text className="text-center font-uiSemibold text-sm text-text">Reset</Text>
          </Pressable>
          <Pressable
            className="flex-1 rounded-lg border border-border bg-bg px-4 py-3 active:opacity-80"
            onPress={() => {
              setCount(0);
              setPhraseIndex((current) => (current + 1) % PHRASES.length);
            }}
          >
            <Text className="text-center font-uiSemibold text-sm text-text">Next phrase</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
