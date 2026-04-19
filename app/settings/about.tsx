import Constants from "expo-constants";
import { Stack } from "expo-router";
import { Linking, Pressable, ScrollView, Share, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { DATA_DELETION_URL, PRIVACY_POLICY_URL, SUPPORT_EMAIL } from "@/constants/legal";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";

function LinkButton({ label, onPress, primary = false }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      className={`rounded-2xl px-5 py-3 active:opacity-80 ${primary ? "bg-primary" : "border border-border bg-bg"}`}
      onPress={onPress}
    >
      <Text className={`text-center font-uiSemibold text-sm ${primary ? "text-primaryForeground" : "text-text"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <Screen className="pt-6" padded={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="px-6">
        <AppHeader title="About Quran" subtitle="Support, credits, policies, and app information." showBack />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 24 }}>
        <SectionCard>
          <Text className="font-uiSemibold text-base text-text">Quran</Text>
          <Text className="mt-2 font-ui text-sm leading-6 text-muted">
            Version {version}. Built for reading, listening, prayer times, tafsir, notes, memorization, and daily Quran habit building.
          </Text>
          <Text className="mt-3 font-ui text-sm leading-6 text-muted">
            This application was built for the sake of my gone father, Dr. Issam Aldwairi.
          </Text>
        </SectionCard>

        <SectionCard className="mt-4">
          <Text className="font-uiSemibold text-base text-text">Support</Text>
          <View className="mt-4 gap-3">
            <LinkButton label="Email support" primary onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
            <LinkButton
              label="Share app"
              onPress={() =>
                Share.share({
                  message: "Quran app for reading, prayer times, tafsir, notes, and memorization.",
                })
              }
            />
          </View>
        </SectionCard>

        <SectionCard className="mt-4">
          <Text className="font-uiSemibold text-base text-text">Policies</Text>
          <View className="mt-4 gap-3">
            <LinkButton label="Privacy policy" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} />
            <LinkButton label="Data deletion instructions" onPress={() => Linking.openURL(DATA_DELETION_URL)} />
          </View>
        </SectionCard>

        <SectionCard className="mt-4">
          <Text className="font-uiSemibold text-base text-text">Credits</Text>
          <Text className="mt-2 font-ui text-sm leading-6 text-muted">
            Quran text, translations, tafsir, and recitation data may be provided through Quran.com API and configured resources. Fonts include Inter, Literata, and Noto Naskh Arabic.
          </Text>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}
