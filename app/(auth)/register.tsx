import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Screen } from "@/components/Screen";
import { getFirebaseAuth, isFirebaseConfigured } from "@/services/firebaseClient";
import { colors } from "@/theme/colors";
import { friendlyFirebaseAuthError } from "@/utils/firebaseAuthErrors";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

const DIAL_CODES = [
  { name: "United States", dial: "+1" },
  { name: "United Kingdom", dial: "+44" },
  { name: "Canada", dial: "+1" },
  { name: "Saudi Arabia", dial: "+966" },
  { name: "United Arab Emirates", dial: "+971" },
  { name: "Qatar", dial: "+974" },
  { name: "Kuwait", dial: "+965" },
  { name: "Bahrain", dial: "+973" },
  { name: "Jordan", dial: "+962" },
  { name: "Egypt", dial: "+20" },
  { name: "Morocco", dial: "+212" },
  { name: "Turkey", dial: "+90" },
  { name: "Pakistan", dial: "+92" },
  { name: "Indonesia", dial: "+62" },
] as const;

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
  const [dial, setDial] = useState<(typeof DIAL_CODES)[number]["dial"]>("+1");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [pickerOpen, setPickerOpen] = useState(false);

  const dialLabel = useMemo(() => {
    const match = DIAL_CODES.find((c) => c.dial === dial);
    return match ? `${match.dial}  ${match.name}` : dial;
  }, [dial]);

  async function handleRegister() {
    if (!configured) {
      Alert.alert(
        "Firebase not configured",
        "Add your Firebase web config values to `.env`, then restart Expo with `npm start -c`."
      );
      return;
    }

    const fn = firstName.trim();
    const ln = lastName.trim();
    const nextEmail = email.trim();
    const digits = phone.replace(/[^\d]/g, "");

    if (!fn) {
      Alert.alert("Missing first name", "Please enter your first name.");
      return;
    }
    if (!ln) {
      Alert.alert("Missing last name", "Please enter your last name.");
      return;
    }
    if (digits.length < 7) {
      Alert.alert("Invalid phone", "Please enter a valid phone number.");
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
    } catch (e) {
      Alert.alert("Sign up failed", friendlyFirebaseAuthError(e));
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
          accessibilityLabel="Sign in"
          onPress={() => router.replace("/login")}
          className="rounded-full bg-surface px-4 py-2 active:opacity-80"
        >
          <Text className="font-uiSemibold text-sm text-text">Sign in</Text>
        </Pressable>
      </View>

      <View className="mt-8 items-center">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primaryMuted">
          <MaterialCommunityIcons name="account-plus-outline" size={28} color={colors.primary} />
        </View>
        <Text className="mt-5 text-center font-uiSemibold text-3xl text-text">Create account</Text>
        <Text className="mt-2 text-center font-ui text-muted">Join to sync bookmarks and favorites.</Text>
      </View>

      <View className="mt-8 rounded-3xl border border-border bg-surface px-5 py-6">
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

        <Text className="mt-4 mb-2 font-uiMedium text-sm text-text">Phone</Text>
        <View className="flex-row gap-3">
          <Pressable
            className="flex-row items-center rounded-2xl border border-border bg-bg px-4 py-3 active:opacity-80"
            onPress={() => setPickerOpen(true)}
          >
            <Text className="font-uiSemibold text-base text-text">{dial}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.muted} style={{ marginLeft: 6 }} />
          </Pressable>
          <View className="flex-1">
            <Field
              icon="phone-outline"
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
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
            <Text className="font-uiSemibold text-sm text-text">Firebase not configured</Text>
            <Text className="mt-1 font-ui text-sm text-muted">
              Add your Firebase web config values to `.env`, then restart Expo with `npm start -c`.
            </Text>
          </View>
        ) : null}
      </View>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable
          className="flex-1 bg-black/40 px-6 py-16"
          onPress={() => setPickerOpen(false)}
        >
          <Pressable
            style={{ maxHeight: 520 }}
            className="rounded-3xl border border-border bg-bg p-4"
            onPress={() => {}}
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-uiSemibold text-base text-text">Country code</Text>
              <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-surface" onPress={() => setPickerOpen(false)}>
                <MaterialCommunityIcons name="close" size={18} color={colors.text} />
              </Pressable>
            </View>

            <Text className="mt-1 font-ui text-sm text-muted">{dialLabel}</Text>

            <ScrollView className="mt-4">
              {DIAL_CODES.map((c) => {
                const selected = c.dial === dial;
                return (
                  <Pressable
                    key={`${c.name}-${c.dial}`}
                    className={`flex-row items-center justify-between rounded-2xl px-4 py-3 active:opacity-80 ${
                      selected ? "bg-primaryMuted" : "bg-transparent"
                    }`}
                    onPress={() => {
                      setDial(c.dial);
                      setPickerOpen(false);
                    }}
                  >
                    <View className="flex-1 pr-4">
                      <Text className="font-uiMedium text-sm text-text">{c.name}</Text>
                      <Text className="mt-0.5 font-ui text-xs text-muted">{c.dial}</Text>
                    </View>
                    {selected ? <MaterialCommunityIcons name="check" size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
