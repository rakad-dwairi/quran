import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, Pressable, Text, View } from "react-native";
import { isFirebaseConfigured } from "@/services/firebaseClient";
import {
  getMissingSocialAuthConfig,
  isSocialSignInCancelled,
  signInWithFacebookAccount,
  signInWithGoogleAccount,
  type SocialAuthProvider,
} from "@/services/socialAuth";
import { colors } from "@/theme/colors";
import { getFriendlySocialAuthError } from "@/utils/socialAuthErrors";

type SocialAuthButtonsProps = {
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
};

const PROVIDERS: {
  id: SocialAuthProvider;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  signIn: () => Promise<unknown>;
}[] = [
  {
    id: "google",
    label: "Continue with Google",
    icon: "google",
    color: "#DB4437",
    signIn: signInWithGoogleAccount,
  },
  {
    id: "facebook",
    label: "Continue with Facebook",
    icon: "facebook",
    color: "#1877F2",
    signIn: signInWithFacebookAccount,
  },
];

export function SocialAuthButtons({ busy, onBusyChange }: SocialAuthButtonsProps) {
  async function handlePress(provider: (typeof PROVIDERS)[number]) {
    if (!isFirebaseConfigured()) {
      Alert.alert(
        "Firebase not configured",
        "Add your Firebase web config values to `.env`, then restart Expo."
      );
      return;
    }

    const missing = getMissingSocialAuthConfig(provider.id);
    if (missing.length) {
      Alert.alert(
        `${provider.label.replace("Continue with ", "")} not configured`,
        `Add ${missing.join(", ")} to \`.env\`, then rebuild the app.`
      );
      return;
    }

    onBusyChange(true);
    try {
      await provider.signIn();
    } catch (error) {
      if (!isSocialSignInCancelled(error)) {
        Alert.alert("Sign in failed", await getFriendlySocialAuthError(error, provider.id));
      }
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <View className="gap-3">
      {PROVIDERS.map((provider) => (
        <Pressable
          key={provider.id}
          className="flex-row items-center justify-center rounded-2xl border border-border bg-bg px-5 py-4 active:opacity-80"
          onPress={() => handlePress(provider)}
          disabled={busy}
        >
          <MaterialCommunityIcons name={provider.icon} size={20} color={provider.color} />
          <Text className="ml-3 font-uiSemibold text-base text-text">
            {busy ? "Working..." : provider.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
