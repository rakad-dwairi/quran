import { Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { isFirebaseConfigured, getFirebaseAuth, getFirestoreDb } from "@/services/firebaseClient";
import { useLibraryStore, type LibraryVerse } from "@/store/libraryStore";
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

export default function AccountScreen() {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!configured) return;
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
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
      };

      const local = useLibraryStore.getState().getSnapshot();
      const mergedBookmarks = mergeVerseMap(local.bookmarks, remote.bookmarks ?? {});
      const mergedFavorites = mergeVerseMap(local.favorites, remote.favorites ?? {});

      useLibraryStore.getState().replaceAll({ bookmarks: mergedBookmarks, favorites: mergedFavorites });

      await setDoc(
        ref,
        {
          bookmarks: mergedBookmarks,
          favorites: mergedFavorites,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      Alert.alert("Synced", "Your bookmarks and favorites are up to date.");
    } catch (e) {
      Alert.alert("Sync failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen className="pt-6">
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader title="Cloud Sync" subtitle="Sync bookmarks/favorites across devices." showBack />

      {status === "not_configured" ? (
        <View className="mt-4 rounded-2xl border border-border bg-surface px-4 py-6">
          <Text className="font-uiSemibold text-base text-text">Firebase not configured</Text>
          <Text className="mt-2 font-ui text-muted">
            Add these env vars, then restart Expo:
            {"\n"}- EXPO_PUBLIC_FIREBASE_API_KEY
            {"\n"}- EXPO_PUBLIC_FIREBASE_PROJECT_ID
            {"\n"}(Optional) AUTH_DOMAIN, STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID
          </Text>
        </View>
      ) : status === "signed_in" ? (
        <View className="mt-4 rounded-2xl border border-border bg-surface px-4 py-6">
          <Text className="font-uiSemibold text-base text-text">Signed in</Text>
          <Text className="mt-2 font-ui text-muted">Email: {user?.email ?? "—"}</Text>
          <Text className="mt-1 font-ui text-muted">UID: {user?.uid}</Text>

          <Pressable
            className="mt-5 rounded-2xl bg-primary px-5 py-3 active:opacity-80"
            onPress={() => syncNow()}
            disabled={busy}
          >
            <Text className="text-center font-uiSemibold text-white">{busy ? "Working…" : "Sync now"}</Text>
          </Pressable>

          <Pressable
            className="mt-3 rounded-2xl bg-white px-5 py-3 active:opacity-80"
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
      ) : (
        <View className="mt-4 rounded-2xl border border-border bg-surface px-4 py-6">
          <Text className="font-uiSemibold text-base text-text">Sign in</Text>
          <Text className="mt-2 font-ui text-muted">
            Sign in on each device using the same account.
          </Text>

          <Text className="mt-5 font-uiMedium text-sm text-text">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="#94A3B8"
            className="mt-2 rounded-2xl border border-border bg-white px-4 py-3 font-ui text-base text-text"
          />

          <Text className="mt-4 font-uiMedium text-sm text-text">Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
            className="mt-2 rounded-2xl border border-border bg-white px-4 py-3 font-ui text-base text-text"
          />

          <View className="mt-5 flex-row gap-3">
            <Pressable
              className="flex-1 rounded-2xl bg-primary px-5 py-3 active:opacity-80"
              onPress={async () => {
                setBusy(true);
                try {
                  await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
                } catch (e) {
                  Alert.alert("Sign in failed", e instanceof Error ? e.message : "Please try again.");
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
            >
              <Text className="text-center font-uiSemibold text-white">{busy ? "Working…" : "Sign in"}</Text>
            </Pressable>

            <Pressable
              className="flex-1 rounded-2xl bg-white px-5 py-3 active:opacity-80"
              onPress={async () => {
                setBusy(true);
                try {
                  await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
                } catch (e) {
                  Alert.alert("Sign up failed", e instanceof Error ? e.message : "Please try again.");
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
            >
              <Text className="text-center font-uiSemibold text-text">Sign up</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Screen>
  );
}
