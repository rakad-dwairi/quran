import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { Screen } from "@/components/Screen";
import { getFirebaseAuth, isFirebaseConfigured } from "@/services/firebaseClient";
import { colors } from "@/theme/colors";
import { friendlyFirebaseAuthError } from "@/utils/firebaseAuthErrors";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginScreen() {
  const { user } = useAuth();
  const configured = isFirebaseConfigured();

  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user]);

  async function handleSignIn() {
    if (!configured) {
      Alert.alert("Firebase not configured", "Add your Firebase web config values to `.env`, then restart Expo with `npm start -c`.");
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
      router.replace("/");
    } catch (e) {
      Alert.alert("Sign in failed", friendlyFirebaseAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp() {
    if (!configured) {
      Alert.alert("Firebase not configured", "Add your Firebase web config values to `.env`, then restart Expo with `npm start -c`.");
      return;
    }
    const nextEmail = email.trim();
    if (!nextEmail) {
      Alert.alert("Missing email", "Please enter your email.");
      return;
    }
    if (!password) {
      Alert.alert("Missing password", "Please enter a password (min 6 characters).");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      await createUserWithEmailAndPassword(getFirebaseAuth(), nextEmail, password);
      router.replace("/");
    } catch (e) {
      Alert.alert("Sign up failed", friendlyFirebaseAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    if (!configured) {
      Alert.alert("Firebase not configured", "Add your Firebase web config values to `.env`, then restart Expo with `npm start -c`.");
      return;
    }
    const nextEmail = email.trim();
    if (!nextEmail) {
      Alert.alert("Enter your email", "Type your email above, then tap “Forgot password”.");
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

      <View className="items-center">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primaryMuted">
          <Text className="font-arabicSemibold text-2xl text-primary">ق</Text>
        </View>
        <Text className="mt-4 text-center font-uiSemibold text-3xl text-text">Welcome</Text>
        <Text className="mt-2 text-center font-ui text-muted">
          Sign in to sync bookmarks and favorites across devices.
        </Text>
      </View>

      <View className="mt-8 rounded-3xl border border-border bg-surface px-5 py-6">
        <Text className="font-uiSemibold text-base text-text">Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={colors.muted}
          className="mt-2 rounded-2xl border border-border bg-white px-4 py-3 font-ui text-base text-text"
        />

        <Text className="mt-4 font-uiSemibold text-base text-text">Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
          className="mt-2 rounded-2xl border border-border bg-white px-4 py-3 font-ui text-base text-text"
        />

        <Pressable
          className="mt-6 rounded-2xl bg-primary px-5 py-3 active:opacity-80"
          onPress={() => handleSignIn()}
          disabled={busy}
        >
          <Text className="text-center font-uiSemibold text-white">{busy ? "Working…" : "Sign in"}</Text>
        </Pressable>

        <Pressable
          className="mt-3 rounded-2xl border border-primary bg-white px-5 py-3 active:opacity-80"
          onPress={() => handleSignUp()}
          disabled={busy}
        >
          <Text className="text-center font-uiSemibold text-text">Sign up</Text>
        </Pressable>

        <Pressable className="mt-4 self-center active:opacity-70" onPress={() => handleForgotPassword()} disabled={busy}>
          <Text className="font-uiSemibold text-primary">Forgot password?</Text>
        </Pressable>

        {!configured ? (
          <View className="mt-6 rounded-2xl border border-border bg-white px-4 py-3">
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

