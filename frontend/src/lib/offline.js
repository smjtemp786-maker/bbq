// Offline-first local storage + sync queue.
import api from "./api";

const QUEUE_KEY = "bb_sync_queue";
const CACHE_PREFIX = "bb_cache_";

export function cacheSet(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, at: Date.now() }));
  } catch (e) {}
}

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw).data : null;
  } catch (e) {
    return null;
  }
}

export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function setQueue(items) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

// Add a local action to the sync queue (SQLite/IndexedDB analogue).
export function enqueue(entity, action, payload) {
  const q = getQueue();
  const item = {
    client_id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random()),
    entity,
    action,
    payload,
    retries: 0,
    created_at: new Date().toISOString(),
    status: "pending",
  };
  q.push(item);
  setQueue(q);
  window.dispatchEvent(new Event("bb-queue-changed"));
  return item;
}

// Flush queued actions to the server. Safe to call repeatedly (idempotent server-side).
export async function flushQueue() {
  const q = getQueue().filter((i) => i.status !== "synced");
  if (q.length === 0) return { synced: 0 };
  try {
    const { data } = await api.post("/sync/push", { items: q });
    const okIds = new Set(
      (data.results || []).filter((r) => r.status === "synced" || r.status === "duplicate").map((r) => r.client_id)
    );
    const remaining = getQueue().filter((i) => !okIds.has(i.client_id));
    setQueue(remaining);
    window.dispatchEvent(new Event("bb-queue-changed"));
    return { synced: okIds.size };
  } catch (e) {
    // still offline / server unreachable — keep queued, bump retries
    const bumped = getQueue().map((i) => ({ ...i, retries: (i.retries || 0) + 1 }));
    setQueue(bumped);
    return { synced: 0, error: true };
  }
}

export function pendingCount() {
  return getQueue().filter((i) => i.status !== "synced").length;
}
