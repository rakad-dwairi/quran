import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "@/theme/colors";

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prayers"
        options={{
          title: t("tabs.prayers"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="mosque" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quran"
        options={{
          title: t("tabs.quran"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-open-page-variant" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: t("tabs.ai"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="robot-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="new"
        options={{
          title: t("tabs.new"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="newspaper-variant-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden routes (still navigable via buttons) */}
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="bookmarks" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
