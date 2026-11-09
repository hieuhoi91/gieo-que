"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  clearLocalHistory,
  deleteLocalHistoryEntry,
  getLocalHistoryConsentSnapshot,
  getLocalHistorySnapshot,
  parseLocalHistory,
  setLocalHistoryConsent,
  subscribeToLocalHistory,
} from "@/lib/local-history";

export default function LocalHistoryPage() {
  const consent = useSyncExternalStore(
    subscribeToLocalHistory,
    getLocalHistoryConsentSnapshot,
    () => "declined",
  );
  const snapshot = useSyncExternalStore(
    subscribeToLocalHistory,
    getLocalHistorySnapshot,
    () => "[]",
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const parsedHistory = useMemo(() => {
    if (consent !== "accepted") {
      return { entries: [], error: null };
    }
    try {
      return { entries: parseLocalHistory(snapshot), error: null };
    } catch (error) {
      console.error("Unable to display local history.", error);
      return {
        entries: [],
        error: "Không thể đọc lịch sử trên thiết bị. Dữ liệu hiện có được giữ nguyên.",
      };
    }
  }, [snapshot, consent]);
  const { entries } = parsedHistory;

  const runStorageAction = (action: () => void) => {
    try {
      action();
      setActionError(null);
    } catch (error) {
      console.error("Unable to update local history.", error);
      setActionError("Không thể cập nhật dữ liệu trên thiết bị. Hãy kiểm tra cài đặt trình duyệt.");
    }
  };

  return (
    <div className="info-shell">
      <header className="info-header">
        <Link className="brand" href="/" aria-label="Về TÂM AN">
          <span className="brand-mark" aria-hidden="true">安</span>
          <span className="brand-name">TÂM AN</span>
        </Link>
        <Link className="footer-link" href="/">Về trải nghiệm</Link>
      </header>
      <main className="info-content">
        <p className="eyebrow"><span /> DỮ LIỆU TRÊN THIẾT BỊ</p>
        <h1>Lịch sử<br /><em>chiêm nghiệm.</em></h1>
        <p className="lead">
          {consent === "accepted"
            ? "Lịch sử được lưu trong bộ nhớ trình duyệt trên thiết bị này, không gửi lên máy chủ."
            : consent === "unavailable"
              ? "Trình duyệt hiện không cho phép truy cập bộ nhớ cục bộ."
              : "Bạn chưa bật lưu lịch sử. Chỉ kết quả bạn đồng ý lưu mới xuất hiện tại đây."}
        </p>
        {consent === "unavailable" ? null : consent !== "accepted" ? (
          <button
            className="button button-primary"
            onClick={() => runStorageAction(() => setLocalHistoryConsent(true))}
            type="button"
          >
            Bật lưu trên thiết bị
          </button>
        ) : (
          <div className="history-actions">
            <button
              className="button button-secondary"
              onClick={() => runStorageAction(clearLocalHistory)}
              type="button"
            >
              Xóa toàn bộ lịch sử
            </button>
            <button
              className="text-button"
              onClick={() => runStorageAction(() => setLocalHistoryConsent(false))}
              type="button"
            >
              Tắt lưu và xóa dữ liệu
            </button>
          </div>
        )}
        {parsedHistory.error && <p className="draw-error" role="alert">{parsedHistory.error}</p>}
        {actionError && <p className="draw-error" role="alert">{actionError}</p>}
        {consent === "accepted" && entries.length === 0 && (
          <p className="empty-history">Chưa có kết quả nào được lưu.</p>
        )}
        <ul className="history-list">
          {entries.map((entry) => (
            <li className="history-entry" key={entry.id}>
              <div>
                <p className="coming-title">{entry.title}</p>
                <p className="coming-description">{entry.summary}</p>
                <time dateTime={entry.createdAt}>
                  {new Intl.DateTimeFormat("vi-VN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(entry.createdAt))}
                </time>
              </div>
              <button
                className="text-button"
                onClick={() => runStorageAction(() => deleteLocalHistoryEntry(entry.id))}
                type="button"
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
