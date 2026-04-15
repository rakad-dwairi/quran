import { router } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { NowPlayingButton } from "@/components/NowPlayingButton";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/providers/AuthProvider";

function ProfileButton() {
  const { user } = useAuth();
  const initial = (user?.email?.trim()?.[0] ?? "U").toUpperCase();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open settings"
      onPress={() => router.push("/settings")}
      className="ml-2 h-10 w-10 overflow-hidden rounded-full border border-border bg-surface active:opacity-80"
    >
      {user?.photoURL ? (
        <Image source={{ uri: user.photoURL }} className="h-10 w-10" resizeMode="cover" />
      ) : (
        <View className="h-10 w-10 items-center justify-center bg-primaryMuted">
          <Text className="font-uiSemibold text-sm text-text">{initial}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function HomeScreen() {
  return (
    <Screen className="pt-6">
      <AppHeader
        title="Home"
        subtitle="Start your day with calm reading and remembrance."
        right={
          <View className="flex-row items-center">
            <NowPlayingButton />
            <ProfileButton />
          </View>
        }
      />

      <View className="mt-4 rounded-2xl border border-border bg-surface px-4 py-5">
        <Text className="font-uiSemibold text-base text-text">Quick actions</Text>

        <View className="mt-4 gap-3">
          <Pressable
            className="rounded-2xl bg-bg px-4 py-4 active:opacity-80"
            onPress={() => router.push("/quran")}
          >
            <Text className="font-uiSemibold text-base text-text">Open Quran</Text>
            <Text className="mt-1 font-ui text-sm text-muted">Browse Surahs and continue reading.</Text>
          </Pressable>

          <Pressable
            className="rounded-2xl bg-bg px-4 py-4 active:opacity-80"
            onPress={() => router.push("/bookmarks")}
          >
            <Text className="font-uiSemibold text-base text-text">Bookmarks</Text>
            <Text className="mt-1 font-ui text-sm text-muted">Saved verses and favorites.</Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-4 rounded-2xl border border-border bg-surface px-4 py-5">
        <Text className="font-uiSemibold text-base text-text">Coming soon</Text>
        <Text className="mt-2 font-ui text-sm text-muted">
          We'll add more features here next (updates, nearby events, and more).
        </Text>
      </View>
    </Screen>
  );
}

