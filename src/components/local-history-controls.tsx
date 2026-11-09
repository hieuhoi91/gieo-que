"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  getLocalHistoryConsentSnapshot,
  saveLocalHistoryEntry,
  setLocalHistoryConsent,
  subscribeToLocalHistory,
  type LocalHistoryEntry,
} from "@/lib/local-history";

export default function LocalHistoryControls({
  entry,
}: {
  entry: Omit<LocalHistoryEntry, "id" | "createdAt" | "demo">;
}) {
  const consent = useSyncExternalStore(
    subscribeToLocalHistory,
    getLocalHistoryConsentSnapshot,
    () => "declined",
  );
  const [storageError, setStorageError] = useState<string | null>(null);
  const getSavedEntry = useCallback(
    () => getSavedSnapshot(entry.title, entry.summary),
    [entry.title, entry.summary],
  );
  const isSaved = useSyncExternalStore(
    subscribeToLocalHistory,
    getSavedEntry,
    () => false,
  );

  if (consent === "unavailable") {
    return <p className="draw-error" role="alert">Trình duyệt hiện không cho phép lưu lịch sử cục bộ.</p>;
  }

  if (consent !== "accepted") {
    return (
      <>
        <button
          className="text-button"
          onClick={() => {
            try {
              setLocalHistoryConsent(true);
              saveLocalHistoryEntry(createEntry(entry));
              setStorageError(null);
            } catch (error) {
              console.error("Unable to enable local history.", error);
              setStorageError("Không thể lưu vào bộ nhớ thiết bị. Hãy kiểm tra cài đặt trình duyệt.");
            }
          }}
          type="button"
        >
          Cho phép lưu lịch sử và lưu kết quả này trên thiết bị
        </button>
        {storageError && <p className="draw-error" role="alert">{storageError}</p>}
      </>
    );
  }

  if (!isSaved) {
    return (
      <>
        <button
          className="text-button"
          onClick={() => {
            try {
              saveLocalHistoryEntry(createEntry(entry));
              setStorageError(null);
            } catch (error) {
              console.error("Unable to save local history.", error);
              setStorageError("Không thể lưu vào bộ nhớ thiết bị. Hãy kiểm tra cài đặt trình duyệt.");
            }
          }}
          type="button"
        >
          Lưu kết quả này trên thiết bị
        </button>
        {storageError && <p className="draw-error" role="alert">{storageError}</p>}
      </>
    );
  }

  function createEntry(entry: Omit<LocalHistoryEntry, "id" | "createdAt" | "demo">): LocalHistoryEntry {
    return {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      demo: true,
    };
  }

  return (
    <>
      {storageError
        ? <p className="draw-error" role="alert">{storageError}</p>
        : <p className="quiet-note">Đã lưu trên thiết bị này · <Link href="/history">Quản lý lịch sử</Link></p>}
    </>
  );
}

function getSavedSnapshot(title: string, summary: string): boolean {
  try {
    const raw = window.localStorage.getItem("tam-an.local-history.entries");
    const entries: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(entries)
      && entries.some((entry) => (
        typeof entry === "object"
        && entry !== null
        && "title" in entry
        && "summary" in entry
        && entry.title === title
        && entry.summary === summary
      ));
  } catch (error) {
    console.error("Unable to check local history.", error);
    return false;
  }
}
