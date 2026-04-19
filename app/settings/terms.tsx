import { Stack } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";

function TermBlock({ title, body }: { title: string; body: string }) {
  return (
    <View className="mt-4">
      <Text className="font-uiSemibold text-sm text-text">{title}</Text>
      <Text className="mt-1 font-ui text-sm leading-6 text-muted">{body}</Text>
    </View>
  );
}

export default function TermsScreen() {
  return (
    <Screen className="pt-6" padded={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="px-6">
        <AppHeader title="Terms & Disclaimers" subtitle="Important notes about Quran, prayer, tafsir, AI, and ads." showBack />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 24 }}>
        <SectionCard>
          <Text className="font-uiSemibold text-base text-text">Use with care</Text>
          <TermBlock
            title="Quran content"
            body="The app provides Quran reading, translations, tafsir, recitation, notes, and study tools. Please report any content issue so it can be reviewed."
          />
          <TermBlock
            title="Tafsir and AI summaries"
            body="AI summaries are optional study aids and may be incomplete or incorrect. They are not religious rulings. For matters of belief, worship, law, or personal guidance, refer to qualified scholars and trusted sources."
          />
          <TermBlock
            title="Prayer times and Qibla"
            body="Prayer times and Qibla direction are calculated estimates based on selected settings and location. Local mosque schedules and trusted authorities may differ."
          />
          <TermBlock
            title="Offline and cloud data"
            body="Some data is stored locally. If Cloud Sync is enabled, saved library data may be stored in Firebase to restore it across devices."
          />
          <TermBlock
            title="Ads"
            body="Ads may be shown to support the app. Ad services may process limited data according to their own policies and platform settings."
          />
        </SectionCard>

        <SectionCard className="mt-4">
          <Text className="font-uiSemibold text-base text-text">Sources and services</Text>
          <Text className="mt-2 font-ui text-sm leading-6 text-muted">
            Quran text, translations, tafsir, and recitation data may be provided through Quran.com API and configured resources. Authentication and cloud sync use Firebase. Ads may use Google AdMob.
          </Text>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}
