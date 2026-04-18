import { Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";
import { StatusBadge } from "@/components/StatusBadge";
import { isFirebaseConfigured, getFirebaseAuth, getFirestoreDb } from "@/services/firebaseClient";
import { useLibraryStore, type LibraryVerse } from "@/store/libraryStore";
import { friendlyFirebaseAuthError } from "@/utils/firebaseAuthErrors";
import { colors } from "@/theme/colors";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

function mergeVerseMap(
  a: Record<string, LibraryVerse>,
  b: Record<string, LibraryVerse>
): Record<string, LibraryVerse> {
  const out: Record<string, LibraryVerse> = { ...a };
  for (const [key, verse] of Object.entries(b)) {
    const existing = out[key];
    if (!existing || verse.createdAt > existing.createdAt) {
      out[key] = verse;
    }
  }
  return out;
}

function formatSyncTime(value: number | null) {
  if (!value) return "Not synced yet";
  return new Date(value).toLocaleString();
}

export default function AccountScreen() {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!configured) return;
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (nextUser) => setUser(nextUser));
    return () => unsub();
  }, [configured]);

  const status = useMemo(() => {
    if (!configured) return "not_configured";
    return user ? "signed_in" : "signed_out";
  }, [configured, user]);

  async function syncNow() {
    if (!configured) return;
    const auth = getFirebaseAuth();
    const current = auth.currentUser;
    if (!current) return;

    setBusy(true);
    try {
      const db = getFirestoreDb();
      const ref = doc(db, "users", current.uid, "library", "main");
      const snap = await getDoc(ref);
      const remote = (snap.exists() ? snap.data() : {}) as {
        bookmarks?: Record<string, LibraryVerse>;
        favorites?: Record<string, LibraryVerse>;
        notes?: Record<string, LibraryVerse>;
      };

      const local = useLibraryStore.getState().getSnapshot();
      const mergedBookmarks = mergeVerseMap(local.bookmarks, remote.bookmarks ?? {});
      const mergedFavorites = mergeVerseMap(local.favorites, remote.favorites ?? {});
      const mergedNotes = mergeVerseMap(local.notes, remote.notes ?? {});

      useLibraryStore.getState().replaceAll({ bookmarks: mergedBookmarks, favorites: mergedFavorites, notes: mergedNotes });

      await setDoc(
        ref,
        {
          bookmarks: mergedBookmarks,
          favorites: mergedFavorites,
          notes: mergedNotes,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setLastSyncedAt(Date.now());
      Alert.alert("Synced", "Your bookmarks, favorites, and notes are up to date.");
    } catch (e) {
      Alert.alert("Sync failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen className="pt-6">
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader title="Cloud Sync" subtitle="Keep bookmarks, favorites, and reading continuity available across devices." showBack />

      {status === "not_configured" ? (
        <EmptyState
          icon="cloud-alert-outline"
          title="Cloud sync is not configured yet"
          body="Add Firebase environment variables and restart Expo. Once configured, users can sign in and sync their saved content."
        />
      ) : status === "signed_in" ? (
        <View className="gap-4">
          <SectionCard>
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <Text className="font-uiSemibold text-base text-text">Signed in</Text>
                <Text className="mt-2 font-ui text-sm leading-6 text-muted">{user?.email ?? "-"}</Text>
                <Text className="mt-1 font-ui text-xs text-muted">Last sync: {formatSyncTime(lastSyncedAt)}</Text>
              </View>
              <StatusBadge label={busy ? "Syncing" : "Ready"} tone={busy ? "accent" : "success"} />
            </View>
          </SectionCard>

          <SectionCard compact>
            <Text className="font-ui text-sm leading-6 text-muted">
              Cloud Sync keeps bookmarks, favorites, and notes aligned across devices signed into the same account.
            </Text>
            <View className="mt-4 gap-3">
              <Pressable className="rounded-2xl bg-primary px-5 py-3 active:opacity-80" onPress={() => syncNow()} disabled={busy}>
                <Text className="text-center font-uiSemibold text-primaryForeground">{busy ? "Working..." : "Sync now"}</Text>
              </Pressable>
              <Pressable
                className="rounded-2xl border border-border bg-bg px-5 py-3 active:opacity-80"
                onPress={async () => {
                  setBusy(true);
                  try {
                    await signOut(getFirebaseAuth());
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
              >
                <Text className="text-center font-uiSemibold text-text">Sign out</Text>
              </Pressable>
            </View>
          </SectionCard>
        </View>
      ) : (
        <View className="gap-4">
          <SectionCard>
            <Text className="font-uiSemibold text-base text-text">Sign in to sync</Text>
            <Text className="mt-2 font-ui text-sm leading-6 text-muted">
              Use the same account on each device to keep your saved verses and reading continuity aligned.
            </Text>
          </SectionCard>

          <SectionCard>
            <Text className="font-uiMedium text-sm text-text">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              className="mt-2 rounded-2xl border border-border bg-bg px-4 py-3 font-ui text-base text-text"
            />

            <Text className="mt-4 font-uiMedium text-sm text-text">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="........"
              placeholderTextColor={colors.muted}
              className="mt-2 rounded-2xl border border-border bg-bg px-4 py-3 font-ui text-base text-text"
            />

            <View className="mt-5 flex-row gap-3">
              <Pressable
                className="flex-1 rounded-2xl bg-primary px-5 py-3 active:opacity-80"
                onPress={async () => {
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
                }}
                disabled={busy}
              >
                <Text className="text-center font-uiSemibold text-primaryForeground">
                  {busy ? "Working..." : "Sign in"}
                </Text>
              </Pressable>

              <Pressable
                className="flex-1 rounded-2xl border border-border bg-bg px-5 py-3 active:opacity-80"
                onPress={async () => {
                  const nextEmail = email.trim();
                  if (!nextEmail) {
                    Alert.alert("Missing email", "Please enter your email.");
                    return;
                  }
                  if (!password) {
                    Alert.alert("Missing password", "Please enter a password.");
                    return;
                  }
                  if (password.length < 6) {
                    Alert.alert("Weak password", "Password must be at least 6 characters.");
                    return;
                  }
                  setBusy(true);
                  try {
                    await createUserWithEmailAndPassword(getFirebaseAuth(), nextEmail, password);
                  } catch (e) {
                    Alert.alert("Sign up failed", friendlyFirebaseAuthError(e));
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
              >
                <Text className="text-center font-uiSemibold text-text">Create account</Text>
              </Pressable>
            </View>
          </SectionCard>
        </View>
      )}
    </Screen>
  );
}
