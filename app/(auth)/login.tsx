import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { Screen } from "@/components/Screen";
import { getFirebaseAuth, isFirebaseConfigured } from "@/services/firebaseClient";
import { colors } from "@/theme/colors";
import { friendlyFirebaseAuthError } from "@/utils/firebaseAuthErrors";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";

function Field({
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  textContentType,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
  textContentType?: React.ComponentProps<typeof TextInput>["textContentType"];
}) {
  return (
    <View className="flex-row items-center rounded-2xl border border-border bg-bg px-4 py-3">
      <MaterialCommunityIcons name={icon} size={20} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        className="ml-3 flex-1 font-ui text-base text-text"
        textContentType={textContentType}
      />
    </View>
  );
}

export default function LoginScreen() {
  const configured = isFirebaseConfigured();

  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignIn() {
    if (!configured) {
      Alert.alert(
        "Firebase not configured",
        "Add your Firebase web config values to `.env`, then restart Expo with `npm start -c`."
      );
      return;
    }
    const nextEmail = email.trim();
    if (!nextEmail) {
      Alert.alert("Missing email", "Please enter your email.");
      return;
    }
    if (!password) {
      Alert.alert("Missing password", "Please enter your password.");
      return;
    }

    setBusy(true);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), nextEmail, password);
    } catch (e) {
      Alert.alert("Sign in failed", friendlyFirebaseAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    if (!configured) {
      Alert.alert(
        "Firebase not configured",
        "Add your Firebase web config values to `.env`, then restart Expo with `npm start -c`."
      );
      return;
    }
    const nextEmail = email.trim();
    if (!nextEmail) {
      Alert.alert("Enter your email", "Type your email above, then tap “Forgot password?”.");
      return;
    }

    setBusy(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), nextEmail);
      Alert.alert("Email sent", "Check your email for a password reset link.");
    } catch (e) {
      Alert.alert("Reset failed", friendlyFirebaseAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen className="pt-10">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-80"
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create account"
          onPress={() => router.push("/register")}
          className="rounded-full bg-surface px-4 py-2 active:opacity-80"
        >
          <Text className="font-uiSemibold text-sm text-text">Sign up</Text>
        </Pressable>
      </View>

      <View className="mt-8 items-center">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primaryMuted">
          <MaterialCommunityIcons name="moon-waning-crescent" size={28} color={colors.primary} />
        </View>
        <Text className="mt-5 text-center font-uiSemibold text-3xl text-text">Welcome back</Text>
        <Text className="mt-2 text-center font-ui text-muted">Sign in to continue your spiritual journey</Text>
      </View>

      <View className="mt-8 rounded-3xl border border-border bg-surface px-5 py-6">
        <Pressable
          className="flex-row items-center justify-center rounded-2xl border border-border bg-bg px-5 py-4 active:opacity-80"
          onPress={() => {}}
        >
          <MaterialCommunityIcons name="google" size={20} color="#DB4437" />
          <Text className="ml-3 font-uiSemibold text-base text-text">Continue with Google</Text>
        </Pressable>

        <View className="mt-5 flex-row items-center">
          <View className="h-px flex-1 bg-border" />
          <Text className="mx-4 font-uiSemibold text-xs text-muted">OR</Text>
          <View className="h-px flex-1 bg-border" />
        </View>

        <Text className="mt-5 mb-2 text-center font-uiSemibold text-sm text-muted">Email</Text>
        <Field
          icon="email-outline"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <Text className="mt-5 mb-2 text-center font-uiSemibold text-sm text-muted">Password</Text>
        <Field
          icon="lock-outline"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          textContentType="password"
        />

        <Pressable
          className="mt-7 rounded-2xl bg-primary px-5 py-4 active:opacity-80"
          onPress={() => handleSignIn()}
          disabled={busy}
        >
          <Text className="text-center font-uiSemibold text-lg text-primaryForeground">{busy ? "Working…" : "Sign in"}</Text>
        </Pressable>

        <Pressable className="mt-5 self-center active:opacity-70" onPress={() => handleForgotPassword()} disabled={busy}>
          <Text className="font-uiSemibold text-primary">Forgot password?</Text>
        </Pressable>

        <View className="mt-6 flex-row items-center justify-center">
          <Text className="font-ui text-sm text-muted">Need an account? </Text>
          <Pressable onPress={() => router.push("/register")} className="active:opacity-70">
            <Text className="font-uiSemibold text-sm text-primary">Sign up</Text>
          </Pressable>
        </View>

        {!configured ? (
          <View className="mt-6 rounded-2xl border border-border bg-bg px-4 py-3">
            <Text className="font-uiSemibold text-sm text-text">Firebase not configured</Text>
            <Text className="mt-1 font-ui text-sm text-muted">
              Add your Firebase web config values to `.env`, then restart Expo with `npm start -c`.
            </Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
