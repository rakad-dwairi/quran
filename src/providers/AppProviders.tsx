import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import type { PropsWithChildren } from "react";
import { AdsProvider } from "@/providers/AdsProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "reactQuery",
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <AdsProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: 1000 * 60 * 60 * 24 * 3,
          }}
        >
          {children}
        </PersistQueryClientProvider>
      </AdsProvider>
    </SafeAreaProvider>
  );
}
