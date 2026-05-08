import type { AttachmentPayload, Session } from "./types";

export function guestSessionsKey(userId: string) {
  return `academiq_guest_sessions_${userId}`;
}

export function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function newSession(userId = "guest"): Session {
  const now = new Date().toISOString();
  return {
    id: makeId(),
    userId,
    title: "New study session",
    pack: null,
    messages: [],
    createdAt: now,
    updatedAt: now
  };
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function normalizeSessions(value: unknown): Session[] {
  return Array.isArray(value) ? (value as Session[]).filter((item) => item?.id) : [];
}

export function readJson<T>(storage: Storage, key: string): T | null {
  try {
    const item = storage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
}

export function readStoredSessions(storage: Storage, key: string) {
  return normalizeSessions(readJson<unknown>(storage, key));
}

export function clearOAuthUrl() {
  window.history.replaceState({}, document.title, window.location.pathname);
}

export async function readAttachment(file: File): Promise<AttachmentPayload> {
  const base = { name: file.name, type: file.type || "unknown", size: file.size };
  const readableText = file.type.startsWith("text/") || /\.(txt|md|csv|json)$/i.test(file.name);
  if (!readableText) {
    return base;
  }
  const content = await file.text();
  return { ...base, content: content.slice(0, 12000) };
}

export function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 17) {
    return "Good afternoon";
  }
  return "Good evening";
}
