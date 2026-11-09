# CODING GUIDELINES --- TÂM AN v2.0

## 1. Chỉ dẫn cho AI coding agent

Đọc toàn bộ `docs/` trước khi code. Không tự thay đổi các quyết định đã
chốt: - Sau thắp nhang là Sân trung tâm. - Sáu khu vực nằm tại Sân trung
tâm. - Nhấn khu vực chuyển thẳng vào phòng tương ứng. - Không
popup/trang giới thiệu trung gian. - Mỗi phòng là scene/module độc lập
và chỉ tải khi cần.

Triển khai theo milestone. Không tạo tất cả trong một lần.

## 2. Quy tắc code

-   TypeScript strict.
-   Server components mặc định; client component khi cần
    state/event/WebGL.
-   Tách UI, domain logic, API và repository.
-   Không đặt nghiệp vụ trong scene component.
-   Không đưa secret lên client.
-   Validate cả client và server.
-   Không dùng `any` nếu không có lý do.
-   Không thêm dependency không cần thiết.
-   Dùng migration có version cho mọi thay đổi DB.

## 3. Scene architecture

Các interface gợi ý:

``` ts
export type RoomId =
  | "fortune-sticks"
  | "yin-yang"
  | "iching"
  | "daily-fortune"
  | "love-fortune"
  | "career-fortune";

export type SceneStatus = "idle" | "loading" | "active" | "error";

export type SceneDefinition = {
  id: RoomId;
  load: () => Promise<{ default: React.ComponentType }>;
  assetManifest: string[];
};
```

`SceneRegistry` chỉ chứa dynamic import. `SceneManager` điều phối scene
và transition. Không tạo một canvas mới cho mọi lần render nếu có thể
tái sử dụng một renderer/canvas ổn định.

## 4. Điều hướng

-   Hotspot sân trung tâm gọi `navigateToRoom(roomId)`.
-   Không mở modal trước khi gọi.
-   Debounce/lock tương tác trong lúc transition.
-   Scene manager hiển thị loading overlay tối giản khi cần.
-   Sau khi load xong, camera ở bên trong phòng.
-   Nút back gọi `navigateToCourtyard()`.
-   Hỗ trợ browser back nếu route được đồng bộ với scene state.
-   Nếu scene load fail, cho retry/back/2D.

## 5. 3D performance

-   Dynamic import scene.
-   Lazy-load model và texture.
-   Giới hạn pixel ratio.
-   Giảm shadow/postprocessing trên mobile.
-   Tránh React setState mỗi frame.
-   Dùng refs trong `useFrame`.
-   Dispose tài nguyên khi scene unmount.
-   Kiểm tra memory khi đi qua lại nhiều phòng.
-   Có fallback nếu WebGL không hỗ trợ.
-   Ưu tiên keyframe animation trước khi thêm physics engine.

## 6. Supabase

-   Client browser và server tách riêng.
-   Service role chỉ server.
-   Không có tài khoản người dùng cuối; lịch sử tùy chọn chỉ lưu trên
    thiết bị.
-   RLS trên dữ liệu; session gieo quẻ chỉ truy cập qua API server-side.
-   Generate database types từ schema.
-   Nội dung public chỉ đọc published.
-   Admin authorization (nếu bật admin) được xác minh server-side.

## 7. Nghiệp vụ gieo quẻ

-   Dùng crypto-secure random phía server khi phương pháp là chọn ngẫu
    nhiên.
-   Không để client quyết định fortune ID.
-   Idempotency key cho request.
-   Lưu phương pháp và snapshot kết quả.
-   Kinh Dịch phải test thứ tự hào, hào động, quẻ chủ/quẻ biến.
-   Âm Dương phải ghi rõ phương pháp và cách diễn giải.
-   Quẻ đầu ngày dùng timezone `Asia/Ho_Chi_Minh`.
-   Không để gói trả phí tác động kết quả.

## 8. Kiểm thử

### Unit

-   Scene registry mapping.
-   Navigation state transitions.
-   Fortune selection.
-   Idempotency.
-   Yin-yang mapping.
-   I Ching six-line mapping and changing lines.
-   Date boundary for daily fortune in Vietnam timezone.

### Integration

-   Public reads only published content.
-   Anonymous user cannot access server sessions directly.
-   Local history can be viewed and deleted on the same device without
    an account.
-   Admin-only mutations.
-   Draw endpoint handles duplicate request.

### E2E

-   Gate → Main Hall → incense → courtyard.
-   Click Xin Xăm → directly inside Xin Xăm room.
-   Click each other hotspot → correct room.
-   Return to courtyard from each room.
-   Scene load failure → retry/back/2D.
-   Mobile touch navigation.
-   Reduced motion.
-   Full draw flow and result.

## 9. Milestones

### M0 --- Foundation

Next.js, TypeScript, Tailwind, lint, env, layout.

### M1 --- 2D navigation prototype

Làm flow bằng UI 2D trước: Cổng → Chính điện → Sân trung tâm → sáu
phòng. Kiểm tra đúng yêu cầu click-to-enter trực tiếp.

### M2 --- Scene manager and courtyard

Tạo canvas, SceneRegistry, SceneManager, hotspot và chuyển cảnh. Dùng
placeholder models.

### M3 --- Six room shells

Tạo sáu scene độc lập, mỗi scene có placeholder và nút về sân. Chưa cần
hoàn thiện nội dung nghi thức.

### M4 --- Incense ritual and first 3D room

Hoàn thiện Chính điện, thắp nhang, Điện Xin Xăm.

### M5 --- Fortune data and backend

Supabase migrations, RLS, catalog, admin draft/review/publish, API xin
xăm.

### M6 --- Remaining ritual modules

Âm Dương, Kinh Dịch, Quẻ Đầu Ngày, Tình Duyên, Công Danh.

### M7 --- Local history, polish and production

Lịch sử cục bộ tùy chọn (không cần tài khoản), accessibility,
performance, SEO, monitoring, deploy. Auth chỉ được cấu hình riêng cho
quản trị viên nếu cần.

## 10. Definition of Done

-   Typecheck/lint/test pass.
-   Không có secret ở client.
-   Navigation đúng yêu cầu.
-   Không popup/trang trung gian.
-   Có loading/error/empty/fallback.
-   Responsive.
-   DB changes có migration.
-   Nội dung có nguồn.
-   Báo cáo file đã đổi, cách test và việc còn lại.
