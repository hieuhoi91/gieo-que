# ARCHITECTURE --- TÂM AN v2.0

## 1. Stack

-   Next.js App Router + TypeScript.
-   Tailwind CSS và shadcn/ui cho UI 2D.
-   Three.js, React Three Fiber, Drei cho 3D.
-   Supabase PostgreSQL và Storage. Người dùng cuối không cần đăng nhập;
    Auth chỉ dành cho quản trị viên nếu bật trang admin.
-   Zod cho validation.
-   Vitest và Playwright.
-   Vercel cho Next.js; Supabase managed backend.

MVP chưa cần NestJS riêng. Tách backend khi có yêu cầu vận hành độc lập,
worker nặng hoặc nhiều client.

## 2. Kiến trúc scene

Tách các scene theo module: - `GateScene` --- Cổng Tam Quan. -
`MainHallScene` --- Chính điện. - `CourtyardScene` --- Sân trung tâm. -
`FortuneSticksScene` --- Điện Xin Xăm. - `YinYangScene` --- Điện Gieo
Quẻ Âm Dương. - `IChingScene` --- Điện Kinh Dịch. - `DailyFortuneScene`
--- Điện Quẻ Đầu Ngày. - `LoveFortuneScene` --- Điện Tình Duyên. -
`CareerFortuneScene` --- Điện Công Danh.

Mỗi scene có lifecycle, asset manifest, camera config và interaction
layer riêng. Scene không cần phải là một URL riêng; có thể dùng route
state hoặc route segment kết hợp scene manager. Quyết định quan trọng là
người dùng cảm nhận được chuyển thẳng vào phòng, không qua màn hình
trung gian.

## 3. Sơ đồ

``` mermaid
flowchart TD
  U[Browser] --> N[Next.js App]
  N --> UI[2D UI and Navigation]
  N --> SM[Scene Manager]
  SM --> G[Gate / Main Hall]
  SM --> C[Courtyard Scene]
  SM --> R[Selected Room Scene]
  R --> I[Interaction Controller]
  I --> API[Next.js API]
  API -. optional admin only .-> AUTH[Supabase Auth]
  API --> DB[(PostgreSQL)]
  API --> ST[Supabase Storage]
```

## 4. Điều hướng click-to-enter

1.  `CourtyardScene` tải mô hình sân và sáu hotspot.
2.  Mỗi hotspot có `roomId` cố định.
3.  Click/touch hotspot gọi `navigateToRoom(roomId)`.
4.  Scene manager khóa input ngắn, chạy fade-out hoặc camera transition.
5.  Unmount hoặc unload scene sân theo chính sách bộ nhớ.
6.  Load scene phòng được chọn.
7.  Fade-in và đặt camera ở vị trí bắt đầu bên trong phòng.
8.  Hiện UI thao tác của phòng ngay lập tức.
9.  Nút "Về sân trung tâm" gọi `navigateToCourtyard()`.
10. Nếu tải phòng thất bại, hiện retry/back/fallback 2D.

Không mở modal giới thiệu phòng, trang xác nhận hoặc trang landing riêng
trước khi vào.

## 5. Quản lý tải scene

-   `SceneRegistry`: ánh xạ roomId → lazy-loaded scene component.
-   `SceneManager`: quản lý scene hiện tại, trạng thái loading/error và
    chuyển cảnh.
-   `AssetManifest`: liệt kê model, texture, audio và kích thước ước
    tính.
-   `SharedAssets`: chỉ chứa asset thực sự dùng chung.
-   `SceneBoundary`: cô lập lỗi render của scene.
-   `SceneFallback`: giao diện 2D thay thế.

Chính sách: - Chỉ tải scene được yêu cầu. - Có thể preload
metadata/thumbnail nhẹ của các phòng. - Không preload toàn bộ model nặng
của sáu phòng cùng lúc. - Khi rời phòng, dispose
geometry/material/texture không dùng. - Có thể cache scene nhẹ nếu
benchmark chứng minh có lợi.

## 6. State machine tổng

``` mermaid
stateDiagram-v2
  [*] --> Gate
  Gate --> MainHall
  MainHall --> IncenseRitual
  IncenseRitual --> Courtyard
  Courtyard --> RoomLoading
  RoomLoading --> RoomActive
  RoomLoading --> RoomError
  RoomError --> RoomLoading: Retry
  RoomError --> Courtyard: Back
  RoomActive --> Courtyard: Return
```

State của nghi thức bên trong phòng là state machine riêng, không gộp
vào navigation state.

## 7. Luồng tạo kết quả

### Xin Xăm

-   Client gửi `systemSlug`, `idempotencyKey`.
-   Server kiểm tra hệ thống published, rate limit và quyền.
-   Server lấy danh sách thẻ hợp lệ, chọn bằng crypto-secure random.
-   Server lưu session và snapshot nội dung.
-   Client nhận kết quả và chạy animation tương ứng.

### Âm Dương

-   Client gửi yêu cầu bắt đầu lượt gieo.
-   Server hoặc logic server-side xác định mặt kết quả theo quy tắc đã
    chọn.
-   Lưu từng lượt, phương pháp và tổng kết.
-   Animation chỉ thể hiện kết quả đã được xác nhận.

### Kinh Dịch

-   Ghi nhận sáu lần gieo theo đúng thứ tự hào.
-   Server tính quẻ chủ và quẻ biến.
-   Unit test mapping 6 hào, hào động và thứ tự từ dưới lên.
-   Lưu phương pháp gieo và kết quả từng hào.

### Quẻ Đầu Ngày

-   Server xác định ngày theo `Asia/Ho_Chi_Minh`.
-   Trả bản ghi daily fortune đã được cấu hình cho ngày đó.
-   Nếu dùng một quẻ chung mỗi ngày, mọi người nhận cùng nội dung trong
    ngày.

### Tình Duyên/Công Danh

-   Là chủ đề nội dung, có thể dùng chung engine chọn nội dung.
-   Không tự sinh dự đoán bằng AI trong MVP.

## 8. Cấu trúc repository

``` text
tam-an/
├── public/
│   ├── models/
│   │   ├── shared/
│   │   ├── gate/
│   │   ├── main-hall/
│   │   ├── courtyard/
│   │   └── rooms/
│   │       ├── fortune-sticks/
│   │       ├── yin-yang/
│   │       ├── iching/
│   │       ├── daily/
│   │       ├── love/
│   │       └── career/
│   ├── textures/
│   ├── audio/
│   └── images/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx
│   │   │   ├── experience/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   ├── about/page.tsx
│   │   │   ├── sources/page.tsx
│   │   │   └── privacy/page.tsx
│   │   ├── admin/
│   │   └── api/
│   │       ├── fortune/draw/route.ts
│   │       ├── yin-yang/draw/route.ts
│   │       ├── iching/draw/route.ts
│   │       └── daily-fortune/route.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── navigation/
│   │   └── scene/
│   ├── scenes/
│   │   ├── registry.ts
│   │   ├── SceneManager.tsx
│   │   ├── gate/
│   │   ├── main-hall/
│   │   ├── courtyard/
│   │   └── rooms/
│   │       ├── fortune-sticks/
│   │       ├── yin-yang/
│   │       ├── iching/
│   │       ├── daily/
│   │       ├── love/
│   │       └── career/
│   ├── features/
│   │   ├── ritual/
│   │   ├── fortune-sticks/
│   │   ├── yin-yang/
│   │   ├── iching/
│   │   ├── daily-fortune/
│   │   ├── love/
│   │   ├── career/
│   │   └── history/
│   ├── server/
│   │   ├── services/
│   │   └── repositories/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── validation/
│   │   ├── security/
│   │   └── utils/
│   ├── stores/
│   ├── types/
│   └── styles/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
└── .env.example
```

## 9. API dự kiến

-   `POST /api/fortune/draw` --- xin xăm.
-   `POST /api/demo/fortune-draw` --- endpoint prototype hiện tại, chỉ
    trả số demo ngẫu nhiên bằng crypto-secure random; không tra cứu hay
    lưu nội dung/quẻ, không thay thế endpoint xin xăm production.
-   `POST /api/demo/ritual` --- mô phỏng hai đồng xu hoặc sáu hào; chỉ
    trả kết quả kỹ thuật ngẫu nhiên, không luận giải văn bản truyền thống.
-   `GET /api/demo/daily` --- trả gợi ý chiêm nghiệm chung theo ngày
    `Asia/Ho_Chi_Minh`, không cá nhân hóa.
-   `POST /api/yin-yang/draw` --- gieo âm dương.
-   `POST /api/iching/draw` --- gieo Kinh Dịch.
-   `GET /api/daily-fortune?date=YYYY-MM-DD` --- lấy quẻ đầu ngày.
-   `GET /api/fortune-sessions/:id` --- lấy kết quả phiên hợp lệ, chỉ
    khi phiên thuộc anonymous session hiện tại.
-   Lịch sử người dùng (nếu bật) lưu trên thiết bị bằng browser storage;
    không cần API lịch sử hoặc tài khoản.

Các route `/about`, `/sources`, `/privacy` và `/history` cung cấp thông
tin nguồn/nội dung, quyền riêng tư và giao diện quản lý lịch sử cục bộ.
Lịch sử chỉ được ghi sau khi người dùng đồng ý và chủ động lưu một kết
quả; có thể xóa từng mục, xóa toàn bộ hoặc tắt lưu.

Các endpoint trải nghiệm công khai không yêu cầu đăng nhập. Tất cả
endpoint phải validate, xử lý lỗi, rate limit phù hợp và không leak
thông tin nội bộ.

## 10. Biến môi trường

``` env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Service role key chỉ dùng server. Không cần cấu hình Auth cho người dùng
cuối; chỉ cấu hình Auth riêng nếu bật trang quản trị. Điều chỉnh tên key
theo loại key Supabase đang dùng trong project.

## 11. Deploy

-   Vercel: frontend và route handlers.
-   Supabase: PostgreSQL, Storage; Auth chỉ cho quản trị viên nếu cần.
-   GLB/texture: public bucket hoặc static hosting/CDN có cache.
-   Chạy migration trước deploy.
-   Thiết lập redirect URL chỉ khi bật Auth cho trang quản trị.
-   Smoke test toàn bộ luồng từ thắp nhang đến sáu phòng.
-   Test tải scene trên điện thoại thật và mạng di động.
