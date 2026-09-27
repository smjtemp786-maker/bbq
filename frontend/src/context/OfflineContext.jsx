import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { flushQueue, pendingCount } from "@/lib/offline";

const OfflineContext = createContext(null);

export function OfflineProvider({ children }) {
  const [online, setOnline] = useState(navigator.onLine);
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [pending, setPending] = useState(pendingCount());
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const isOnline = online && !simulatedOffline;

  const refreshPending = useCallback(() => setPending(pendingCount()), []);

  const sync = useCallback(async () => {
    if (!isOnline) return;
    setSyncing(true);
    const res = await flushQueue();
    setSyncing(false);
    setPending(pendingCount());
    if (!res.error) setLastSync(new Date());
  }, [isOnline]);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener("bb-queue-changed", refreshPending);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("bb-queue-changed", refreshPending);
    };
  }, [refreshPending]);

  // auto-sync when we come (back) online
  useEffect(() => {
    if (isOnline) sync();
  }, [isOnline, sync]);

  return (
    <OfflineContext.Provider
      value={{ isOnline, simulatedOffline, setSimulatedOffline, pending, sync, syncing, lastSync, refreshPending }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export const useOffline = () => useContext(OfflineContext);
