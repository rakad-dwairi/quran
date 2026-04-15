import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { Platform } from "react-native";
import {
  getAuth,
  initializeAuth,
  type Auth,
} from "firebase/auth";

type FirebaseConfig = {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
};

function getConfig(): FirebaseConfig | null {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) return null;

  return {
    apiKey,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
}

export function isFirebaseConfigured() {
  return !!getConfig();
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  const config = getConfig();
  if (!config) {
    throw new Error("Firebase is not configured. Set EXPO_PUBLIC_FIREBASE_API_KEY and EXPO_PUBLIC_FIREBASE_PROJECT_ID.");
  }
  app = getApps().length ? getApp() : initializeApp(config);
  return app;
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  const firebaseApp = getFirebaseApp();

  if (Platform.OS === "web") {
    auth = getAuth(firebaseApp);
  } else {
    // Firebase Auth expects `persistence` to be a **class** (constructed with `new`),
    // not an object instance. This minimal class wraps AsyncStorage.
    const ReactNativeAsyncStoragePersistence = class {
      type = "LOCAL";

      async _isAvailable() {
        try {
          await AsyncStorage.setItem("__firebase_auth_test__", "1");
          await AsyncStorage.removeItem("__firebase_auth_test__");
          return true;
        } catch {
          return false;
        }
      }

      _set(key: string, value: unknown) {
        return AsyncStorage.setItem(key, JSON.stringify(value));
      }

      async _get(key: string) {
        const raw = await AsyncStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      }

      _remove(key: string) {
        return AsyncStorage.removeItem(key);
      }

      _addListener() {}
      _removeListener() {}
    };

    auth = initializeAuth(firebaseApp, {
      persistence: ReactNativeAsyncStoragePersistence as any,
    });
  }
  return auth;
}

export function getFirestoreDb(): Firestore {
  if (db) return db;
  db = getFirestore(getFirebaseApp());
  return db;
}
