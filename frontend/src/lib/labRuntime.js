import api from "@/lib/api";
import { enqueue, flushQueue } from "@/lib/offline";

// Offline-first project save: queue locally, then push if online.
export async function saveProjectOfflineFirst({ id, name, type, data, thumbnail, ownerId, isOnline }) {
  const projectId = id || (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
  const payload = { id: projectId, name, type, data, thumbnail: thumbnail || "", owner_id: ownerId };
  enqueue("project", "upsert", payload);
  if (isOnline) {
    try {
      await api.post("/projects", { id: projectId, name, type, data, thumbnail: thumbnail || "" });
      await flushQueue();
    } catch (e) {}
  }
  return projectId;
}

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

// Compile & run generated JS with lab-specific helper functions injected.
export async function runGeneratedCode(code, helpers) {
  const names = Object.keys(helpers);
  const wrapped = `${code}`;
  const fn = new AsyncFunction(...names, wrapped);
  return fn(...names.map((n) => helpers[n]));
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
