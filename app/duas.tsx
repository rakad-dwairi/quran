import { Stack } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";

const DAILY_DUAS = [
  {
    title: "Morning remembrance",
    arabic: "اللهم بك أصبحنا وبك أمسينا وبك نحيا وبك نموت وإليك النشور",
    translation: "O Allah, by You we enter the morning, by You we enter the evening, by You we live and by You we die, and to You is the resurrection.",
  },
  {
    title: "Seeking ease",
    arabic: "اللهم لا سهل إلا ما جعلته سهلا وأنت تجعل الحزن إذا شئت سهلا",
    translation: "O Allah, nothing is easy except what You make easy, and You make difficulty easy if You will.",
  },
  {
    title: "Asking for guidance",
    arabic: "رب زدني علما",
    translation: "My Lord, increase me in knowledge.",
  },
  {
    title: "For forgiveness",
    arabic: "رب اغفر لي وتب علي إنك أنت التواب الرحيم",
    translation: "My Lord, forgive me and accept my repentance. You are the Accepting of repentance, the Merciful.",
  },
];

export default function DuasScreen() {
  return (
    <Screen className="pt-6">
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader title="Duas" subtitle="Daily supplications." showBack />

      <ScrollView className="mt-4 flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        {DAILY_DUAS.map((dua) => (
          <View key={dua.title} className="mb-3 rounded-2xl border border-border bg-surface p-4">
            <Text className="font-uiSemibold text-base text-text">{dua.title}</Text>
            <Text className="mt-3 font-arabic text-xl text-text" style={{ writingDirection: "rtl", textAlign: "right" }}>
              {dua.arabic}
            </Text>
            <Text className="mt-3 font-serif text-sm text-muted">{dua.translation}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
