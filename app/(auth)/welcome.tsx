import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Pressable, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import { colors } from "@/theme/colors";

const BISMILLAH_AR = "بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
const BISMILLAH_EN = "In the name of God, the Most Gracious, the Most Merciful";

function Pattern() {
  const tint = "rgba(255,255,255,0.06)";
  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      <MaterialCommunityIcons name="hexagon" size={220} color={tint} style={{ position: "absolute", top: 70, left: -70 }} />
      <MaterialCommunityIcons name="hexagon" size={220} color={tint} style={{ position: "absolute", top: 120, right: -90 }} />
      <MaterialCommunityIcons name="hexagon" size={220} color={tint} style={{ position: "absolute", top: 290, left: 80 }} />
      <MaterialCommunityIcons name="hexagon" size={220} color={tint} style={{ position: "absolute", top: 430, right: 60 }} />
      <MaterialCommunityIcons name="hexagon" size={220} color={tint} style={{ position: "absolute", bottom: 140, left: -50 }} />
      <MaterialCommunityIcons name="hexagon" size={220} color={tint} style={{ position: "absolute", bottom: 90, right: -70 }} />
    </View>
  );
}

export default function WelcomeScreen() {
  const [arabicCount, setArabicCount] = useState(0);
  const [englishWordsVisible, setEnglishWordsVisible] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;

  const englishWords = useMemo(() => BISMILLAH_EN.split(" "), []);

  useEffect(() => {
    let cancelled = false;

    const arabicTimer = setInterval(() => {
      if (cancelled) return;
      setArabicCount((c) => {
        if (c >= BISMILLAH_AR.length) return c;
        return c + 1;
      });
    }, 28);

    return () => {
      cancelled = true;
      clearInterval(arabicTimer);
    };
  }, []);

  useEffect(() => {
    if (arabicCount < BISMILLAH_AR.length) return;
    if (englishWordsVisible >= englishWords.length) return;

    const timer = setInterval(() => {
      setEnglishWordsVisible((c) => Math.min(englishWords.length, c + 1));
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }).start();
    }, 220);

    return () => clearInterval(timer);
  }, [arabicCount, englishWords.length, englishWordsVisible, fade]);

  const arabicText = useMemo(() => BISMILLAH_AR.slice(0, arabicCount), [arabicCount]);
  const englishText = useMemo(() => englishWords.slice(0, englishWordsVisible).join(" "), [englishWords, englishWordsVisible]);

  return (
    <Screen padded={false} backgroundColor={colors.primary} showAd={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <Pattern />

      <View className="flex-1 justify-between px-6 pt-14">
        <View className="items-center">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-white/10">
            <Image
              source={require("../../assets/logo-mark.png")}
              style={{ width: 48, height: 48, borderRadius: 24 }}
              resizeMode="contain"
            />
          </View>

          <Text
            className="mt-10 text-center font-arabicSemibold"
            style={{
              fontSize: 34,
              lineHeight: 62,
              color: colors.accent,
              writingDirection: "rtl",
              textAlign: "center",
            }}
          >
            {arabicText}
          </Text>

          <View className="mt-6 h-px w-28" style={{ backgroundColor: "rgba(206,165,85,0.65)" }} />

          <Animated.Text
            style={{ opacity: fade }}
            className="mt-6 text-center font-ui text-lg text-white/80"
          >
            {englishText}
          </Animated.Text>
        </View>

        <View className="rounded-t-3xl bg-bg px-6 pt-7 pb-10">
          <View className="items-center">
            <View className="h-1 w-14 rounded-full bg-border" />
          </View>

          <View className="mt-6 items-center">
            <Text className="text-center font-serifMedium text-4xl text-text">Welcome</Text>
            <Text className="mt-2 text-center font-ui text-base text-muted">
              Sign in to sync your bookmarks and favorites.
            </Text>
          </View>

          <Pressable
            className="mt-7 flex-row items-center justify-center rounded-2xl bg-primary px-5 py-4 active:opacity-80"
            onPress={() => router.push("/login")}
          >
            <MaterialCommunityIcons name="login" size={22} color={colors.primaryForeground} />
            <Text className="ml-3 font-uiSemibold text-lg text-primaryForeground">Sign In to Your Account</Text>
          </Pressable>

          <View className="mt-4 flex-row items-center">
            <View className="h-px flex-1 bg-border" />
            <Text className="mx-4 font-uiSemibold text-xs text-muted">OR</Text>
            <View className="h-px flex-1 bg-border" />
          </View>

          <Pressable
            className="mt-4 flex-row items-center justify-center rounded-2xl border border-border bg-bg px-5 py-4 active:opacity-80"
            onPress={() => router.push("/register")}
          >
            <MaterialCommunityIcons name="account-plus-outline" size={22} color={colors.text} />
            <Text className="ml-3 font-uiSemibold text-lg text-text">Create New Account</Text>
          </Pressable>

          <View className="mt-6 gap-3">
            <View className="flex-row items-center rounded-2xl border border-border bg-surface px-4 py-4">
              <MaterialCommunityIcons name="book-open-page-variant" size={18} color={colors.primary} />
              <Text className="ml-3 font-ui text-sm text-muted">Daily Quran readings & reflections</Text>
            </View>
            <View className="flex-row items-center rounded-2xl border border-border bg-surface px-4 py-4">
              <MaterialCommunityIcons name="mosque" size={18} color={colors.primary} />
              <Text className="ml-3 font-ui text-sm text-muted">Prayer times, Qibla & reminders</Text>
            </View>
            <View className="flex-row items-center rounded-2xl border border-border bg-surface px-4 py-4">
              <MaterialCommunityIcons name="hand-heart" size={18} color={colors.primary} />
              <Text className="ml-3 font-ui text-sm text-muted">Bookmarks, favorites & duas</Text>
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}
