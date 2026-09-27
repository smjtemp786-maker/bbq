import React from "react";
import { User, Mail, Building2, Shield, Wifi, WifiOff, Database, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useOffline } from "@/context/OfflineContext";
import { Page } from "@/components/common/Page";
import { getQueue } from "@/lib/offline";

export default function Profile() {
  const { user } = useAuth();
  const { isOnline, pending, sync, syncing, simulatedOffline, setSimulatedOffline, lastSync } = useOffline();
  const queue = getQueue();

  return (
    <Page title="Profile" subtitle="Your account and offline sync settings.">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-2xl font-bold text-primary-foreground">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="mt-4 font-heading text-xl font-bold">{user.name}</h2>
            <span className="mt-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">{user.role.replace("_", " ")}</span>
          </div>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground"><Mail className="h-4 w-4" /> {user.email}</div>
            <div className="flex items-center gap-3 text-muted-foreground"><Shield className="h-4 w-4" /> Role: {user.role}</div>
            <div className="flex items-center gap-3 text-muted-foreground"><Building2 className="h-4 w-4" /> Center linked</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h3 className="flex items-center gap-2 font-heading text-lg font-semibold"><Database className="h-5 w-5 text-primary" /> Offline & Sync</h3>
          <p className="mt-1 text-sm text-muted-foreground">Your work is saved locally first and synced when a connection is available.</p>

          <div className="mt-5 flex items-center justify-between rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              {isOnline ? <Wifi className="h-5 w-5 text-emerald-500" /> : <WifiOff className="h-5 w-5 text-amber-500" />}
              <div>
                <p className="text-sm font-medium">{isOnline ? "Online" : "Offline Mode"}</p>
                <p className="text-xs text-muted-foreground">{isOnline ? "Changes sync automatically." : "Changes are queued locally."}</p>
              </div>
            </div>
            <button
              onClick={() => setSimulatedOffline((v) => !v)}
              data-testid="profile-offline-toggle"
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${simulatedOffline ? "bg-amber-500 text-white" : "border border-border"}`}
            >
              {simulatedOffline ? "Go Online" : "Simulate Offline"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Pending sync</p>
              <p className="mt-1 font-heading text-2xl font-bold">{pending}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Last sync</p>
              <p className="mt-1 text-sm font-medium">{lastSync ? lastSync.toLocaleTimeString() : "—"}</p>
            </div>
          </div>

          <button
            onClick={sync}
            disabled={!isOnline || pending === 0}
            data-testid="profile-sync-button"
            className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} /> Sync Now
          </button>

          {queue.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Queued actions</p>
              <div className="max-h-40 space-y-1 overflow-auto">
                {queue.slice(0, 10).map((q) => (
                  <div key={q.client_id} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs">
                    <span className="font-mono">{q.entity} · {q.action}</span>
                    <span className="text-muted-foreground">{new Date(q.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
