export type LocalHistoryEntry = {
  id: string;
  createdAt: string;
  room: string;
  title: string;
  summary: string;
  demo: true;
};

const consentKey = "tam-an.local-history.consent";
const historyKey = "tam-an.local-history.entries";
const maxEntries = 50;
const changeEvent = "tam-an.local-history.change";
const allowedRooms = new Set([
  "fortune-sticks",
  "yin-yang",
  "iching",
  "daily-fortune",
  "love-fortune",
  "career-fortune",
]);

export function subscribeToLocalHistory(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(changeEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(changeEvent, onStoreChange);
  };
}

export function getLocalHistorySnapshot(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return window.localStorage.getItem(historyKey) ?? "[]";
  } catch {
    return "__storage_unavailable__";
  }
}

export function getLocalHistoryConsentSnapshot(): string {
  try {
    return hasLocalHistoryConsent() ? "accepted" : "declined";
  } catch {
    return "unavailable";
  }
}

export function hasLocalHistoryConsent(): boolean {
  return typeof window !== "undefined" && window.localStorage.getItem(consentKey) === "accepted";
}

export function setLocalHistoryConsent(accepted: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  if (accepted) {
    window.localStorage.setItem(consentKey, "accepted");
    notifyLocalHistoryChange();
    return;
  }
  window.localStorage.removeItem(consentKey);
  window.localStorage.removeItem(historyKey);
  notifyLocalHistoryChange();
}

export function readLocalHistory(): LocalHistoryEntry[] {
  if (typeof window === "undefined" || !hasLocalHistoryConsent()) {
    return [];
  }
  const raw = window.localStorage.getItem(historyKey);
  if (!raw) {
    return [];
  }
  return parseLocalHistory(raw);
}

export function parseLocalHistory(raw: string): LocalHistoryEntry[] {
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every(isLocalHistoryEntry)) {
    throw new Error("Lịch sử trên thiết bị không đúng định dạng; dữ liệu gốc vẫn được giữ nguyên.");
  }
  return value.slice(0, maxEntries);
}

export function saveLocalHistoryEntry(entry: LocalHistoryEntry): void {
  if (!hasLocalHistoryConsent()) {
    throw new Error("Chưa được người dùng cho phép lưu lịch sử trên thiết bị.");
  }
  const entries = [entry, ...readLocalHistory().filter((saved) => saved.id !== entry.id)].slice(0, maxEntries);
  window.localStorage.setItem(historyKey, JSON.stringify(entries));
  notifyLocalHistoryChange();
}

export function deleteLocalHistoryEntry(id: string): void {
  window.localStorage.setItem(
    historyKey,
    JSON.stringify(readLocalHistory().filter((entry) => entry.id !== id)),
  );
  notifyLocalHistoryChange();
}

export function clearLocalHistory(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(historyKey);
    notifyLocalHistoryChange();
  }
}

function notifyLocalHistoryChange(): void {
  window.dispatchEvent(new Event(changeEvent));
}

function isLocalHistoryEntry(value: unknown): value is LocalHistoryEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return typeof entry.id === "string"
    && entry.id.length <= 256
    && typeof entry.createdAt === "string"
    && Number.isFinite(Date.parse(entry.createdAt))
    && typeof entry.room === "string"
    && allowedRooms.has(entry.room)
    && typeof entry.title === "string"
    && entry.title.length <= 200
    && typeof entry.summary === "string"
    && entry.summary.length <= 2000
    && entry.demo === true;
}
