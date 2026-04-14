import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View className="flex-1 items-center justify-center bg-bg px-6">
        <Text className="font-uiSemibold text-lg text-text">Page not found</Text>
        <Link href="/" className="mt-4">
          <Text className="font-uiMedium text-primary">Go home</Text>
        </Link>
      </View>
    </>
  );
}

