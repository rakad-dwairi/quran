import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Screen } from "@/components/Screen";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { getFirebaseAuth, getFirestoreDb, isFirebaseConfigured } from "@/services/firebaseClient";
import { colors } from "@/theme/colors";
import { friendlyFirebaseAuthError } from "@/utils/firebaseAuthErrors";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

function Field({
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = "none",
  textContentType,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
  autoCapitalize?: React.ComponentProps<typeof TextInput>["autoCapitalize"];
  textContentType?: React.ComponentProps<typeof TextInput>["textContentType"];
}) {
  return (
    <View className="flex-row items-center rounded-2xl border border-border bg-bg px-4 py-3">
      <MaterialCommunityIcons name={icon} size={20} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        className="ml-3 flex-1 font-ui text-base text-text"
        textContentType={textContentType}
      />
    </View>
  );
}

export default function RegisterScreen() {
  const configured = isFirebaseConfigured();
  const [busy, setBusy] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function handleRegister() {
    if (!configured) {
      Alert.alert(
        "Sign up unavailable",
        "This build is missing Firebase settings. Add the Firebase environment values to EAS, then rebuild the app."
      );
      return;
    }

    const fn = firstName.trim();
    const ln = lastName.trim();
    const nextEmail = email.trim();

    if (!fn) {
      Alert.alert("Missing first name", "Please enter your first name.");
      return;
    }
    if (!ln) {
      Alert.alert("Missing last name", "Please enter your last name.");
      return;
    }
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
    if (password !== confirm) {
      Alert.alert("Passwords don’t match", "Please confirm your password.");
      return;
    }

    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), nextEmail, password);
      const displayName = `${fn} ${ln}`.trim();
      await updateProfile(cred.user, { displayName }).catch(() => {});

      // Store additional profile fields in Firestore for admin visibility.
      // This lets you view user info in Firebase Console → Firestore Database → Data → users/{uid}.
      try {
        const db = getFirestoreDb();
        await setDoc(
          doc(db, "users", cred.user.uid),
          {
            uid: cred.user.uid,
            email: nextEmail,
            displayName,
            firstName: fn,
            lastName: ln,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (e) {
        Alert.alert(
          "Profile not saved",
          e instanceof Error
            ? `${e.message}\n\nCheck your Firestore rules to allow users to write to users/{uid}.`
            : "Check your Firestore rules to allow users to write to users/{uid}."
        );
      }
    } catch (e) {
      Alert.alert("Sign up failed", friendlyFirebaseAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen padded={false} showAd={false}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 36 }}
      >
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
            accessibilityLabel="Sign in"
            onPress={() => router.replace("/login")}
            className="rounded-full bg-surface px-4 py-2 active:opacity-80"
          >
            <Text className="font-uiSemibold text-sm text-text">Sign in</Text>
          </Pressable>
        </View>

        <View className="mt-8 items-center">
          <View className="h-16 w-16 overflow-hidden rounded-full bg-primaryMuted">
            <Image
              source={require("../../assets/logo-mark.png")}
              style={{ width: 64, height: 64 }}
              resizeMode="cover"
            />
          </View>
          <Text className="mt-5 text-center font-uiSemibold text-3xl text-text">Create account</Text>
          <Text className="mt-2 text-center font-ui text-muted">Join to sync bookmarks and favorites.</Text>
        </View>

        <View className="mt-8 rounded-3xl border border-border bg-surface px-5 py-6">
          <SocialAuthButtons busy={busy} onBusyChange={setBusy} />

          <View className="my-5 flex-row items-center">
            <View className="h-px flex-1 bg-border" />
            <Text className="mx-4 font-uiSemibold text-xs text-muted">OR</Text>
            <View className="h-px flex-1 bg-border" />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-2 font-uiMedium text-sm text-text">First name</Text>
              <Field
                icon="account-outline"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                autoCapitalize="words"
                textContentType="givenName"
              />
            </View>
            <View className="flex-1">
              <Text className="mb-2 font-uiMedium text-sm text-text">Last name</Text>
              <Field
                icon="account-outline"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                autoCapitalize="words"
                textContentType="familyName"
              />
            </View>
          </View>

          <Text className="mt-4 mb-2 font-uiMedium text-sm text-text">Email</Text>
          <Field
            icon="email-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
          />

          <Text className="mt-4 mb-2 font-uiMedium text-sm text-text">Password</Text>
          <Field
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            textContentType="newPassword"
          />

          <Text className="mt-4 mb-2 font-uiMedium text-sm text-text">Confirm password</Text>
          <Field
            icon="lock-check-outline"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="••••••••"
            secureTextEntry
            textContentType="newPassword"
          />

          <Pressable
            className="mt-7 rounded-2xl bg-primary px-5 py-4 active:opacity-80"
            onPress={() => handleRegister()}
            disabled={busy}
          >
            <Text className="text-center font-uiSemibold text-lg text-primaryForeground">
              {busy ? "Working…" : "Sign up"}
            </Text>
          </Pressable>

          {!configured ? (
            <View className="mt-6 rounded-2xl border border-border bg-bg px-4 py-3">
              <Text className="font-uiSemibold text-sm text-text">Sign up unavailable in this build</Text>
              <Text className="mt-1 font-ui text-sm text-muted">
                Firebase settings were not included in the store build. Add them to EAS environment variables and rebuild.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

    </Screen>
  );
}
