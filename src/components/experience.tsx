"use client";

import { useEffect, useRef, useState } from "react";
import TempleScene, { type RoomId, type SceneKind } from "@/components/temple-scene";
import RoomActivities, { type RoomActivityOutcome } from "@/components/room-activities";
import LocalHistoryControls from "@/components/local-history-controls";
import InfoLinks from "@/components/info-links";
import { playRitualSound, setRitualSoundsEnabled } from "@/lib/ritual-sounds";

type Scene = "welcome" | "gate" | "main-hall" | "courtyard" | RoomId;

type DrawResult = {
  demo: true;
  number: number;
  title: string;
  contentStatus: "fictional_demo";
  message: string;
  reflection: string;
};

type DemoDraw = Omit<DrawResult, "reflection">;

function isDemoDraw(value: unknown): value is DemoDraw {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const result = value as Record<string, unknown>;
  return result.demo === true
    && typeof result.number === "number"
    && Number.isInteger(result.number)
    && result.number >= 1
    && result.number <= 100
    && typeof result.title === "string"
    && result.contentStatus === "fictional_demo"
    && typeof result.message === "string";
}

function isAiReading(value: unknown): value is { title: string; reading: string; reflection: string } {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  return typeof result.title === "string"
    && typeof result.reading === "string"
    && typeof result.reflection === "string";
}

type Room = {
  id: RoomId;
  name: string;
  shortName: string;
  symbol: string;
  description: string;
  reflection: string;
};

const rooms: Room[] = [
  {
    id: "fortune-sticks",
    name: "Điện Xin Xăm",
    shortName: "Xin Xăm",
    symbol: "籤",
    description: "Tìm hiểu tục xin xăm qua một trải nghiệm mô phỏng.",
    reflection: "Mỗi kết quả sẽ được trình bày cùng nguồn và ghi chú biên tập.",
  },
  {
    id: "yin-yang",
    name: "Điện Gieo Quẻ Âm Dương",
    shortName: "Âm Dương",
    symbol: "☯",
    description: "Khám phá cách gieo và ý nghĩa của quẻ âm dương.",
    reflection: "Phương pháp và quy ước sẽ được giải thích rõ trong trải nghiệm.",
  },
  {
    id: "iching",
    name: "Điện Kinh Dịch",
    shortName: "Kinh Dịch",
    symbol: "易",
    description: "Tìm hiểu cấu trúc sáu hào và các quẻ trong Kinh Dịch.",
    reflection: "Nội dung sẽ phân biệt văn bản nguồn với diễn giải hiện đại.",
  },
  {
    id: "daily-fortune",
    name: "Điện Quẻ Đầu Ngày",
    shortName: "Quẻ Đầu Ngày",
    symbol: "☼",
    description: "Một gợi ý chiêm nghiệm nhẹ nhàng cho ngày hôm nay.",
    reflection: "Đây là nội dung chung trong ngày, không phải dự đoán cá nhân.",
  },
  {
    id: "love-fortune",
    name: "Điện Tình Duyên",
    shortName: "Tình Duyên",
    symbol: "♡",
    description: "Những góc nhìn về giao tiếp và vun đắp mối quan hệ.",
    reflection: "Tôn trọng, lắng nghe và ranh giới là nền tảng của kết nối.",
  },
  {
    id: "career-fortune",
    name: "Điện Công Danh",
    shortName: "Công Danh",
    symbol: "文",
    description: "Dành một khoảng lặng để nhìn lại việc học và công việc.",
    reflection: "Cân nhắc dữ kiện thực tế trước những lựa chọn quan trọng.",
  },
];

function getSceneKind(scene: Scene): SceneKind {
  switch (scene) {
    case "welcome":
    case "gate":
    case "main-hall":
    case "courtyard":
      return scene;
    default:
      return "room";
  }
}

function waitForAnimation(duration: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

export default function Experience() {
  const [scene, setScene] = useState<Scene>("welcome");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [incenseSticks, setIncenseSticks] = useState<Array<"available" | "flying" | "placed">>([
    "available",
    "available",
    "available",
  ]);
  const [drawState, setDrawState] = useState<"idle" | "shaking" | "falling" | "focused" | "error">("idle");
  const [drawError, setDrawError] = useState<string | null>(null);
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null);
  const [activityVisual, setActivityVisual] = useState<{ coins?: number[]; lines?: number[] }>({});
  const [activityRequest, setActivityRequest] = useState(0);
  const [activityResult, setActivityResult] = useState<RoomActivityOutcome | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const drawAttempt = useRef(0);
  const fortuneCardRef = useRef<HTMLElement>(null);
  const activityCardRef = useRef<HTMLElement>(null);
  const roomExitButtonRef = useRef<HTMLButtonElement>(null);
  const currentRoom = rooms.find((room) => room.id === scene);
  const incenseCount = incenseSticks.filter((stick) => stick === "placed").length;
  const incenseAnimating = incenseSticks.some((stick) => stick === "flying");

  useEffect(() => {
    if (drawState === "focused") {
      playRitualSound("reveal");
      (currentRoom?.id === "fortune-sticks" ? fortuneCardRef.current : activityCardRef.current)?.focus();
    }
  }, [currentRoom?.id, drawState]);

  const enterScene = (nextScene: Scene) => {
    if (nextScene !== scene) {
      drawAttempt.current += 1;
      setDrawResult(null);
      setActivityRequest(0);
      setActivityResult(null);
      setActivityError(null);
      setDrawState("idle");
      setActivityVisual({});
      setScene(nextScene);
    }
  };
  const offerIncense = (index: number) => {
    setIncenseSticks((current) => current.map((stick, stickIndex) => (
      stickIndex === index && stick === "available" ? "flying" : stick
    )));
  };
  const placeIncense = (index: number) => {
    setIncenseSticks((current) => current.map((stick, stickIndex) => (
      stickIndex === index && stick === "flying" ? "placed" : stick
    )));
  };
  const drawFortuneStick = async () => {
    if (drawState === "shaking" || drawState === "falling" || drawState === "focused") {
      return;
    }

    const attempt = ++drawAttempt.current;
    playRitualSound("urn-shake");
    setDrawState("shaking");
    setDrawResult(null);
    setDrawError(null);
    try {
      const [response] = await Promise.all([
        fetch("/api/demo/fortune-draw", { method: "POST" }),
        waitForAnimation(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 120 : 1500),
      ]);
      if (attempt !== drawAttempt.current) return;
      if (!response.ok) {
        throw new Error(`Lượt xin xăm thất bại (${response.status}).`);
      }

      const draw: unknown = await response.json();
      if (!isDemoDraw(draw)) {
        throw new Error("Phản hồi từ máy chủ không đúng định dạng demo.");
      }
      setDrawState("falling");
      playRitualSound("stick-drop");
      const [aiResponse] = await Promise.all([
        fetch("/api/ai/interpretation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: "fortune-sticks", ritual: { number: draw.number } }),
          cache: "no-store",
        }),
        waitForAnimation(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 120 : 1000),
      ]);
      if (attempt !== drawAttempt.current) return;
      if (!aiResponse.ok) {
        const errorPayload: unknown = await aiResponse.json().catch(() => null);
        const message = typeof errorPayload === "object" && errorPayload !== null
          && "error" in errorPayload && typeof errorPayload.error === "string"
          ? errorPayload.error
          : `Không thể tạo lời luận giải (${aiResponse.status}).`;
        throw new Error(message);
      }
      const aiPayload: unknown = await aiResponse.json();
      if (!isAiReading(aiPayload)) throw new Error("Lời luận giải không đúng định dạng.");
      setDrawResult({
        ...draw,
        title: aiPayload.title,
        message: aiPayload.reading,
        reflection: aiPayload.reflection,
      });
      if (attempt === drawAttempt.current) setDrawState("focused");
    } catch (error) {
      if (attempt !== drawAttempt.current) return;
      console.error("Unable to draw demo fortune stick.", error);
      setDrawError(error instanceof Error ? error.message : "Có lỗi khi tạo lời luận giải.");
      setDrawState("error");
    }
  };
  const closeFortuneCard = () => {
    setDrawResult(null);
    setActivityResult(null);
    setDrawState("idle");
    roomExitButtonRef.current?.focus();
  };
  const runRoomActivity = () => {
    if (drawState === "shaking" || drawState === "falling" || drawState === "focused") return;
    if (currentRoom && currentRoom.id !== "fortune-sticks") {
      playRitualSound("activity", currentRoom.id);
    }
    setActivityError(null);
    setActivityResult(null);
    setActivityVisual({});
    setActivityRequest((request) => request + 1);
    setDrawState("shaking");
  };
  const activityCue = currentRoom?.id === "yin-yang"
    ? "Chạm hai đồng xu để gieo quẻ mô phỏng"
    : currentRoom?.id === "iching"
      ? "Chạm sáu hào để tạo một quẻ mô phỏng"
      : currentRoom?.id === "daily-fortune"
        ? "Chạm biểu tượng mặt trời để nhận gợi ý trong ngày"
        : currentRoom?.id === "love-fortune"
          ? "Chạm vòng đôi để mở một câu hỏi chiêm nghiệm"
          : currentRoom?.id === "career-fortune"
            ? "Chạm cuộn thư để mở một câu hỏi chiêm nghiệm"
            : "";
  const activityAction = currentRoom?.id === "yin-yang"
    ? "Gieo đồng xu"
    : currentRoom?.id === "iching"
      ? "Tạo sáu hào"
      : currentRoom?.id === "daily-fortune"
        ? "Nhận gợi ý hôm nay"
        : currentRoom?.id === "love-fortune"
          ? "Mở gợi ý Tình Duyên"
          : "Mở gợi ý Công Danh";

  const sceneName = currentRoom?.name
    ?? (scene === "welcome"
      ? "TÂM AN"
      : scene === "gate"
        ? "Cổng Tam Quan"
        : scene === "main-hall"
          ? "Chính điện"
          : "Sân trung tâm");
  const roomAnimationClass = currentRoom && currentRoom.id !== "fortune-sticks"
    && (drawState === "shaking" || drawState === "falling")
    ? `activity-${drawState}`
    : "";

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          aria-label="Về trang bắt đầu"
          className="brand"
          onClick={() => enterScene("welcome")}
          type="button"
        >
          <span className="brand-mark" aria-hidden="true">安</span>
          <span className="brand-name">TÂM AN</span>
        </button>
        <div className="topbar-meta">
          <span className="topbar-note">KHÔNG GIAN VĂN HÓA & CHIÊM NGHIỆM</span>
          <button
            aria-label={soundEnabled ? "Tắt âm thanh nghi thức" : "Bật âm thanh nghi thức"}
            aria-pressed={soundEnabled}
            className="sound-toggle"
            onClick={() => {
              const nextEnabled = !soundEnabled;
              setSoundEnabled(nextEnabled);
              setRitualSoundsEnabled(nextEnabled);
            }}
            type="button"
          >
            <span aria-hidden="true">{soundEnabled ? "♫" : "♪"}</span>
            Âm thanh
          </button>
          <span className="privacy-badge"><span aria-hidden="true">●</span> Không cần đăng nhập</span>
        </div>
      </header>

      <main className="experience">
        <section className={`scene scene-${scene} ${roomAnimationClass}`}>
          <div className="scene-world" aria-label={`Mô hình 3D: ${sceneName}`}>
            <TempleScene
              drawNumber={currentRoom?.id === "fortune-sticks" ? drawResult?.number : undefined}
              drawPhase={currentRoom ? drawState : "idle"}
              onDrawFortuneStick={drawFortuneStick}
              onRunRoomActivity={runRoomActivity}
              coinValues={currentRoom?.id === "yin-yang" ? activityVisual.coins : undefined}
              lineValues={currentRoom?.id === "iching" ? activityVisual.lines : undefined}
              incenseCount={incenseCount}
              incenseSticks={incenseSticks}
              incenseAnimating={incenseAnimating}
              onOfferIncense={offerIncense}
              onIncensePlaced={placeIncense}
              onEnterRoom={enterScene}
              roomId={currentRoom?.id}
              rooms={rooms}
              scene={getSceneKind(scene)}
            />
          </div>

          <div className="scene-topline">
            <span className="scene-location">
              <span className="location-dot" />
              {sceneName}
            </span>
            <span className="prototype-label">MÔ HÌNH 3D TƯƠNG TÁC</span>
          </div>

          {scene === "welcome" && (
            <div className="welcome-panel glass-panel">
              <p className="eyebrow"><span /> MỘT KHOẢNG LẶNG CHO RIÊNG MÌNH</p>
              <h1>Trở về với<br /><em>sự tĩnh tại.</em></h1>
              <p className="lead">
                Bước vào không gian văn hóa để tìm hiểu, chiêm nghiệm và dành
                cho mình một phút bình yên.
              </p>
              <button className="button button-primary" onClick={() => enterScene("gate")} type="button">
                Bắt đầu hành trình <span aria-hidden="true">↗</span>
              </button>
              <p className="quiet-note">Không cần tài khoản · Kéo để xoay góc nhìn</p>
            </div>
          )}

          {scene === "gate" && (
            <div className="journey-panel glass-panel">
              <p className="eyebrow"><span /> ĐIỂM KHỞI ĐẦU</p>
              <h1>Qua cổng,<br /><em>vào chốn an yên.</em></h1>
              <p className="lead">
                Phía trước là Chính điện. Hãy bước tiếp để thắp nén nhang mô
                phỏng hoặc đi thẳng đến sân.
              </p>
              <button className="button button-primary" onClick={() => enterScene("main-hall")} type="button">
                Vào Chính điện <span aria-hidden="true">→</span>
              </button>
              <button className="text-button" onClick={() => enterScene("courtyard")} type="button">
                Bỏ qua, đến Sân trung tâm
              </button>
            </div>
          )}

          {scene === "main-hall" && (
            <div className="incense-controls">
              <p className="incense-cue" role="status" aria-live="polite">
                {incenseCount === 3
                  ? "Đã thắp đủ ba cây nhang · khói đang bay lên"
                  : `Chạm vào cây nhang để cắm vào lư hương · ${incenseCount}/3`}
              </p>
              <div className="incense-actions">
                {incenseSticks.map((stick, index) => stick === "available" && (
                  <button
                    className="visually-hidden"
                    key={index}
                    onClick={() => offerIncense(index)}
                    type="button"
                  >
                    Thắp cây nhang {index + 1}
                  </button>
                ))}
                <button
                  className="incense-exit-button"
                  onClick={() => enterScene("courtyard")}
                  type="button"
                >
                  {incenseCount === 3 ? "Đến Sân trung tâm →" : "Bỏ qua, đến Sân trung tâm →"}
                </button>
              </div>
            </div>
          )}

          {scene === "courtyard" && (
            <div className="courtyard-panel glass-panel">
              <div className="courtyard-heading">
                <div>
                  <p className="eyebrow"><span /> TÙY TÂM KHÁM PHÁ</p>
                  <h1>Sân trung tâm</h1>
                  <p className="lead">Chạm một điện trong mô hình hoặc chọn điểm đến.</p>
                </div>
                <span className="room-count">06 <span>điểm đến</span></span>
              </div>
              <div className="room-list">
                {rooms.map((room, index) => (
                  <button
                    className="room-chip"
                    key={room.id}
                    onClick={() => enterScene(room.id)}
                    type="button"
                  >
                    <span className="room-chip-index">0{index + 1}</span>
                    <span>{room.shortName}</span>
                    <span className="room-chip-arrow" aria-hidden="true">↗</span>
                  </button>
                ))}
              </div>
              <p className="quiet-note">Không cần đi theo thứ tự · Kéo để xoay mô hình</p>
            </div>
          )}

          {currentRoom?.id === "fortune-sticks" ? (
            <>
              {(drawState === "idle" || drawState === "error") && (
                <div className="urn-cue">
                  <span>Chạm vào ống xăm trong mô hình để rút thẻ</span>
                  <button
                    className="visually-hidden urn-keyboard-action"
                    onClick={drawFortuneStick}
                    type="button"
                  >
                    Lắc ống xăm
                  </button>
                </div>
              )}
              {(drawState === "shaking" || drawState === "falling") && (
                <p className="draw-status" role="status" aria-live="polite">
                  {drawState === "shaking" ? "Ống xăm đang lắc mạnh, các que đang va vào nhau…" : "Đang hoàn tất thẻ xăm và lời luận giải…"}
                </p>
              )}
              {drawState === "error" && (
                <div className="draw-error-panel" role="alert">
                  <span>{drawError ?? "Chưa thể lấy kết quả từ máy chủ."}</span>
                  <button className="text-button" onClick={drawFortuneStick} type="button">Thử lại</button>
                </div>
              )}
              <button
                ref={roomExitButtonRef}
                className="room-exit-button"
                onClick={() => enterScene("courtyard")}
                type="button"
              >
                <span aria-hidden="true">←</span> Về Sân trung tâm
              </button>
              {drawState === "focused" && drawResult && (
                <div className="fortune-focus-backdrop">
                  <article
                    ref={fortuneCardRef}
                    className="fortune-focus-card"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="fortune-focus-title"
                    tabIndex={-1}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        closeFortuneCard();
                        return;
                      }
                      if (event.key === "Tab") {
                        const focusable = Array.from(
                          event.currentTarget.querySelectorAll<HTMLElement>(
                            'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
                          ),
                        );
                        const first = focusable[0];
                        const last = focusable[focusable.length - 1];
                        if (!first || !last) return;
                        if (event.shiftKey && document.activeElement === first) {
                          event.preventDefault();
                          last.focus();
                        } else if (!event.shiftKey && document.activeElement === last) {
                          event.preventDefault();
                          first.focus();
                        } else if (document.activeElement === event.currentTarget) {
                          event.preventDefault();
                          (event.shiftKey ? last : first).focus();
                        }
                      }
                    }}
                  >
                    <div className="fortune-card-seal" aria-hidden="true">安</div>
                    <p className="eyebrow"><span /> THẺ XĂM DEMO</p>
                    <span className="fortune-focus-number">
                      {String(drawResult.number).padStart(2, "0")}
                    </span>
                    <h1 id="fortune-focus-title">{drawResult.title}</h1>
                    <p className="fortune-focus-message">{drawResult.message}</p>
                    <p className="fortune-focus-reflection">{drawResult.reflection}</p>
                    <p className="fortune-focus-note">
                      Lời luận giải từ số thẻ ngẫu nhiên · Không phải lời xăm truyền thống đã xác minh
                    </p>
                    <LocalHistoryControls
                      entry={{
                        room: currentRoom.id,
                        title: drawResult.title,
                        summary: drawResult.message,
                      }}
                    />
                    <button
                      className="button button-secondary fortune-close-button"
                      onClick={closeFortuneCard}
                      type="button"
                    >
                      Đóng thẻ, xem lại điện
                    </button>
                  </article>
                </div>
              )}
            </>
          ) : currentRoom ? (
            <>
              <RoomActivities
                onError={setActivityError}
                onPhaseChange={setDrawState}
                onResult={setActivityResult}
                onVisualUpdate={setActivityVisual}
                requestId={activityRequest}
                roomId={currentRoom.id}
              />
              {(drawState === "idle" || drawState === "error") && (
                <div className="room-activity-cue">
                  <span>{activityCue}</span>
                  <button
                    className="visually-hidden urn-keyboard-action"
                    onClick={runRoomActivity}
                    type="button"
                  >
                    {activityAction}
                  </button>
                </div>
              )}
              {(drawState === "shaking" || drawState === "falling") && (
                <p className="draw-status" role="status" aria-live="polite">
                  {drawState === "shaking"
                    ? currentRoom.id === "yin-yang"
                      ? "Đồng xu đang tung lên…"
                      : currentRoom.id === "iching"
                        ? "Các hào đang chuyển động…"
                        : currentRoom.id === "daily-fortune"
                          ? "Ánh mặt trời đang bừng sáng…"
                          : currentRoom.id === "love-fortune"
                            ? "Vòng đôi đang lay chuyển…"
                            : "Cuộn thư đang mở…"
                    : "Đang hoàn tất kết quả và lời luận giải…"}
                </p>
              )}
              {drawState === "error" && (
                <div className="draw-error-panel" role="alert">
                  <span>{activityError ?? "Chưa thể tạo kết quả demo."}</span>
                  <button className="text-button" onClick={runRoomActivity} type="button">Thử lại</button>
                </div>
              )}
              <button
                ref={roomExitButtonRef}
                className="room-exit-button"
                onClick={() => enterScene("courtyard")}
                type="button"
              >
                <span aria-hidden="true">←</span> Về Sân trung tâm
              </button>
              {drawState === "focused" && activityResult && (
                <div className="fortune-focus-backdrop">
                  <article
                    ref={activityCardRef}
                    className="fortune-focus-card activity-focus-card"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="activity-focus-title"
                    tabIndex={-1}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        closeFortuneCard();
                        return;
                      }
                      if (event.key === "Tab") {
                        const focusable = Array.from(
                          event.currentTarget.querySelectorAll<HTMLElement>(
                            'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
                          ),
                        );
                        const first = focusable[0];
                        const last = focusable[focusable.length - 1];
                        if (!first || !last) return;
                        if (event.shiftKey && document.activeElement === first) {
                          event.preventDefault();
                          last.focus();
                        } else if (!event.shiftKey && document.activeElement === last) {
                          event.preventDefault();
                          first.focus();
                        } else if (document.activeElement === event.currentTarget) {
                          event.preventDefault();
                          (event.shiftKey ? last : first).focus();
                        }
                      }
                    }}
                  >
                    <div className="fortune-card-seal" aria-hidden="true">安</div>
                    <p className="eyebrow"><span /> LUẬN GIẢI · {currentRoom.shortName.toLocaleUpperCase("vi-VN")}</p>
                    <span className="fortune-focus-number activity-focus-symbol" aria-hidden="true">
                      {activityResult.symbol}
                    </span>
                    <h1 id="activity-focus-title">{activityResult.title}</h1>
                    {activityResult.details && (
                      <div className="hexagram-results" aria-label="Các hào mô phỏng">
                        <div className="hexagram-result">
                          {activityResult.details.map((line, index) => (
                            <span className="hexagram-line" key={index}>{line}</span>
                          ))}
                        </div>
                        {activityResult.changedDetails && (
                          <div className="hexagram-result" aria-label="Dạng sau khi đổi các hào động">
                            {activityResult.changedDetails.map((line, index) => (
                              <span className="hexagram-line" key={index}>{line}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <p className="fortune-focus-message">{activityResult.summary}</p>
                    {activityResult.reflection && (
                      <p className="fortune-focus-reflection">{activityResult.reflection}</p>
                    )}
                    {activityResult.ritualNote && (
                      <p className="fortune-focus-ritual-note">{activityResult.ritualNote}</p>
                    )}
                    <p className="fortune-focus-note">
                      Nội dung mô phỏng để tìm hiểu và chiêm nghiệm · Không phải dự đoán hay tư liệu truyền thống đã xác minh
                    </p>
                    <LocalHistoryControls
                      entry={{
                        room: currentRoom.id,
                        title: activityResult.title,
                        summary: activityResult.summary,
                      }}
                    />
                    <button
                      className="button button-secondary fortune-close-button"
                      onClick={closeFortuneCard}
                      type="button"
                    >
                      Đóng kết quả, xem lại điện
                    </button>
                  </article>
                </div>
              )}
            </>
          ) : null}

          <div className="scene-hint" aria-hidden="true">KÉO ĐỂ XOAY · CUỘN ĐỂ THU PHÓNG</div>
        </section>

        <footer className="experience-footer">
          <span>© TÂM AN</span>
          <span>Trải nghiệm mô phỏng để tìm hiểu và chiêm nghiệm</span>
          {scene !== "welcome" && (
            <button className="footer-link" onClick={() => enterScene("welcome")} type="button">
              Kết thúc trải nghiệm
            </button>
          )}
        </footer>
        <InfoLinks />
      </main>
    </div>
  );
}
