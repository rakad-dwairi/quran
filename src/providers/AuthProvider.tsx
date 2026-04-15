import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/services/firebaseClient";

type AuthContextValue = {
  configured: boolean;
  initializing: boolean;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue>({
  configured: false,
  initializing: true,
  user: null,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!configured) {
      setUser(null);
      setInitializing(false);
      return;
    }

    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return () => unsub();
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({ configured, initializing, user }),
    [configured, initializing, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

