"use client";

import { useEffect } from "react";
import type { DrawPhase, RoomId } from "@/components/temple-scene";

type YinYangResult = {
  demo: true;
  system: "yin-yang";
  coins: [0 | 1, 0 | 1];
  heads: number;
  method: string;
};

type IChingResult = {
  demo: true;
  system: "iching";
  lines: Array<{ value: number; polarity: "yin" | "yang"; changing: boolean }>;
  changedLines: Array<{ polarity: "yin" | "yang" }>;
  method: string;
};

type DailyResult = {
  demo: true;
  date: string;
  timezone: "Asia/Ho_Chi_Minh";
  title: string;
  prompt: string;
  notice: string;
};

export type RoomActivityOutcome = {
  title: string;
  summary: string;
  symbol: string;
  reflection?: string;
  ritualNote?: string;
  details?: string[];
  changedDetails?: string[];
};

type AiReading = { title: string; reading: string; reflection: string };

function isAiReading(value: unknown): value is AiReading {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  return typeof result.title === "string"
    && typeof result.reading === "string"
    && typeof result.reflection === "string";
}

function isYinYangResult(value: unknown): value is YinYangResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  return result.demo === true
    && result.system === "yin-yang"
    && Array.isArray(result.coins)
    && result.coins.length === 2
    && result.coins.every((coin) => coin === 0 || coin === 1)
    && typeof result.heads === "number"
    && typeof result.method === "string";
}

function isIChingResult(value: unknown): value is IChingResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  return result.demo === true
    && result.system === "iching"
    && Array.isArray(result.lines)
    && result.lines.length === 6
    && result.lines.every((line) => (
      typeof line === "object"
      && line !== null
      && "value" in line
      && (line.value === 6 || line.value === 7 || line.value === 8 || line.value === 9)
      && "polarity" in line
      && (line.polarity === "yin" || line.polarity === "yang")
      && "changing" in line
      && typeof line.changing === "boolean"
    ))
    && Array.isArray(result.changedLines)
    && result.changedLines.length === 6
    && typeof result.method === "string";
}

function isDailyResult(value: unknown): value is DailyResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  return result.demo === true
    && typeof result.date === "string"
    && result.timezone === "Asia/Ho_Chi_Minh"
    && typeof result.title === "string"
    && typeof result.prompt === "string"
    && typeof result.notice === "string";
}

function waitForAnimation(duration: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

async function createOutcome(roomId: RoomId): Promise<{
  outcome: RoomActivityOutcome;
  visual: { coins?: number[]; lines?: number[] };
}> {
  let ritual: Record<string, unknown> = {};
  let visual: { coins?: number[]; lines?: number[] } = {};
  let baseOutcome: RoomActivityOutcome;

  if (roomId === "love-fortune" || roomId === "career-fortune") {
    baseOutcome = { title: "", summary: "", symbol: roomId === "love-fortune" ? "♡" : "文" };
  } else {
    const isDaily = roomId === "daily-fortune";
    const response = isDaily
      ? await fetch("/api/demo/daily", { cache: "no-store" })
      : await fetch("/api/demo/ritual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: roomId }),
      });
    if (!response.ok) throw new Error(`Không thể tạo kết quả nghi thức (${response.status}).`);

    const payload: unknown = await response.json();
    if (roomId === "yin-yang" && isYinYangResult(payload)) {
      ritual = { coins: payload.coins };
      visual = { coins: payload.coins };
      baseOutcome = {
        title: "",
        summary: "",
        symbol: payload.coins.map((coin) => coin ? "●" : "○").join("  "),
        ritualNote: `Kết quả mô phỏng: ${payload.heads}/2 mặt ngửa. ${payload.method}`,
      };
    } else if (roomId === "iching" && isIChingResult(payload)) {
      ritual = { lines: payload.lines };
      visual = { lines: payload.lines.map((line) => line.value) };
      baseOutcome = {
        title: "",
        summary: "",
        symbol: "易",
        ritualNote: payload.method,
        details: payload.lines.map((line) => line.polarity === "yang" ? "━━━━━━" : "━━  ━━"),
        changedDetails: payload.lines.some((line) => line.changing)
          ? payload.changedLines.map((line) => line.polarity === "yang" ? "━━━━━━" : "━━  ━━")
          : undefined,
      };
    } else if (isDaily && isDailyResult(payload)) {
      ritual = { date: payload.date, title: payload.title, prompt: payload.prompt };
      baseOutcome = {
        title: "",
        summary: "",
        symbol: payload.date.slice(8),
        ritualNote: `${payload.prompt} (${payload.date}, giờ Việt Nam)`,
      };
    } else {
      throw new Error("Kết quả nghi thức không đúng định dạng.");
    }
  }

  const readingResponse = await fetch("/api/ai/interpretation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, ritual }),
    cache: "no-store",
  });
  if (!readingResponse.ok) {
    const errorPayload: unknown = await readingResponse.json().catch(() => null);
    const message = typeof errorPayload === "object" && errorPayload !== null
      && "error" in errorPayload && typeof errorPayload.error === "string"
      ? errorPayload.error
      : `Không thể tạo lời luận giải (${readingResponse.status}).`;
    throw new Error(message);
  }
  const aiPayload: unknown = await readingResponse.json();
  if (!isAiReading(aiPayload)) throw new Error("Lời luận giải không đúng định dạng.");
  return {
    outcome: {
      ...baseOutcome,
      title: aiPayload.title,
      summary: aiPayload.reading,
      reflection: aiPayload.reflection,
    },
    visual,
  };
}

export default function RoomActivities({
  roomId,
  requestId,
  onPhaseChange,
  onVisualUpdate,
  onResult,
  onError,
}: {
  roomId: RoomId;
  requestId: number;
  onPhaseChange: (phase: DrawPhase) => void;
  onVisualUpdate: (values: { coins?: number[]; lines?: number[] }) => void;
  onResult: (result: RoomActivityOutcome) => void;
  onError: (message: string) => void;
}) {
  useEffect(() => {
    if (requestId === 0) return;
    let cancelled = false;
    const motionDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 120 : 2200;

    const run = async () => {
      try {
        const [created] = await Promise.all([
          createOutcome(roomId),
          waitForAnimation(motionDuration),
        ]);
        if (cancelled) return;
        onResult(created.outcome);
        onVisualUpdate(created.visual);
        onPhaseChange("falling");
        await waitForAnimation(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 120 : 850);
        if (!cancelled) onPhaseChange("focused");
      } catch (caught) {
        if (cancelled) return;
        console.error("Unable to create room demo result.", caught);
        onError(caught instanceof Error ? caught.message : "Có lỗi khi tạo kết quả demo.");
        onPhaseChange("error");
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [onError, onPhaseChange, onResult, onVisualUpdate, requestId, roomId]);

  return null;
}
