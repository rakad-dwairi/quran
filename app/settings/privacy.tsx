import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { Alert, Linking, Pressable, ScrollView, Share, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { DATA_DELETION_URL, PRIVACY_POLICY_URL } from "@/constants/legal";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";
import { useToast } from "@/providers/ToastProvider";
import { useLibraryStore } from "@/store/libraryStore";
import { colors } from "@/theme/colors";

function DataRow({ title, body }: { title: string; body: string }) {
  return (
    <View className="mt-4">
      <Text className="font-uiSemibold text-sm text-text">{title}</Text>
      <Text className="mt-1 font-ui text-sm leading-6 text-muted">{body}</Text>
    </View>
  );
}

export default function PrivacyScreen() {
  const { showToast } = useToast();

  async function exportLibraryData() {
    const snapshot = useLibraryStore.getState().getSnapshot();
    await Share.share({
      message: JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          library: snapshot,
        },
        null,
        2
      ),
    });
  }

  function confirmDeleteLocalData() {
    Alert.alert(
      "Delete local saved data?",
      "This clears bookmarks, favorites, notes, collections, and memorization data stored on this device. Cloud data is not deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete local data",
          style: "destructive",
          onPress: async () => {
            useLibraryStore.getState().replaceAll({
              bookmarks: {},
              favorites: {},
              notes: {},
              collections: {},
              memorized: {},
            });
            await AsyncStorage.removeItem("library-v1").catch(() => {});
            showToast({ tone: "success", title: "Local data cleared", body: "Your saved library was removed from this device." });
          },
        },
      ]
    );
  }

  return (
    <Screen className="pt-6" padded={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="px-6">
        <AppHeader title="Privacy & Data" subtitle="Clear language about what the app uses and why." showBack />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 24 }}>
        <SectionCard>
          <Text className="font-uiSemibold text-base text-text">Your data at a glance</Text>
          <DataRow
            title="On-device library"
            body="Bookmarks, favorites, notes, collections, memorization progress, reading settings, and reading-plan progress are stored on this device."
          />
          <DataRow
            title="Cloud Sync"
            body="If you sign in and press Sync now, saved library data is stored in Firebase so it can be restored on your devices."
          />
          <DataRow
            title="Location"
            body="Location is used for prayer times and Qibla. The app can also use a manual city/location if you prefer."
          />
          <DataRow
            title="Notifications"
            body="Notifications are used for daily ayah, reading plan reminders, and prayer alerts when you enable them."
          />
          <DataRow
            title="AI tafsir"
            body="When you generate an AI summary, the selected ayah, translation, and tafsir text are sent to the configured AI backend. AI summaries are study aids and can be imperfect."
          />
          <DataRow
            title="Ads"
            body="AdMob may process device and interaction data to deliver and measure ads, depending on platform settings and consent requirements."
          />
        </SectionCard>

        <SectionCard className="mt-4">
          <Text className="font-uiSemibold text-base text-text">Policy links</Text>
          <View className="mt-4 gap-3">
            <Pressable className="rounded-2xl bg-primary px-5 py-3 active:opacity-80" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
              <Text className="text-center font-uiSemibold text-primaryForeground">Open privacy policy</Text>
            </Pressable>
            <Pressable className="rounded-2xl border border-border bg-bg px-5 py-3 active:opacity-80" onPress={() => Linking.openURL(DATA_DELETION_URL)}>
              <Text className="text-center font-uiSemibold text-text">Open data deletion instructions</Text>
            </Pressable>
          </View>
        </SectionCard>

        <SectionCard className="mt-4">
          <Text className="font-uiSemibold text-base text-text">Controls</Text>
          <View className="mt-4 gap-3">
            <Pressable className="rounded-2xl border border-border bg-bg px-5 py-3 active:opacity-80" onPress={() => exportLibraryData()}>
              <Text className="text-center font-uiSemibold text-text">Export saved library</Text>
            </Pressable>
            <Pressable className="rounded-2xl border border-border bg-bg px-5 py-3 active:opacity-80" onPress={confirmDeleteLocalData}>
              <Text className="text-center font-uiSemibold" style={{ color: colors.danger }}>Delete local saved data</Text>
            </Pressable>
          </View>
        </SectionCard>

        <SectionCard className="mt-4">
          <Text className="font-uiSemibold text-base text-text">Account deletion</Text>
          <Text className="mt-2 font-ui text-sm leading-6 text-muted">
            If you created an account, open Cloud Sync to delete your account and associated cloud library data.
          </Text>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}
