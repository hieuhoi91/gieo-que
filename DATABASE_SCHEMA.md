# DATABASE SCHEMA --- TÂM AN v2.0

## 1. Mô hình dữ liệu

Người dùng cuối sử dụng ẩn danh, không có hồ sơ tài khoản. Lịch sử tùy
chọn lưu trên thiết bị và không cần bảng `profiles` hoặc `user_notes`.
Các nhóm dữ liệu phía server: - Danh mục khu vực: `experience_rooms`.
- Hệ thống quẻ: `fortune_systems`. - Nội dung quẻ: `fortunes`,
`fortune_interpretations`. - Phiên trải nghiệm: `experience_sessions`.
- Kết quả gieo: `fortune_sessions`, `fortune_draw_steps`. - Quẻ đầu
ngày: `daily_fortunes`. - Asset: `scene_assets`.

## 2. ERD

``` mermaid
erDiagram
  EXPERIENCE_ROOMS ||--o{ EXPERIENCE_SESSIONS : enters
  FORTUNE_SYSTEMS ||--o{ FORTUNES : contains
  FORTUNE_SYSTEMS ||--o{ FORTUNE_SESSIONS : uses
  FORTUNES ||--o{ FORTUNE_SESSIONS : selected
  FORTUNE_SESSIONS ||--o{ FORTUNE_DRAW_STEPS : has
  FORTUNES ||--o{ FORTUNE_INTERPRETATIONS : has
```

## 3. SQL migration khởi đầu

``` sql
create extension if not exists pgcrypto;

create table public.experience_rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  scene_key text not null unique,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.experience_rooms (slug, name, scene_key, sort_order) values
('xin-xam', 'Điện Xin Xăm', 'fortune-sticks', 1),
('am-duong', 'Điện Gieo Quẻ Âm Dương', 'yin-yang', 2),
('kinh-dich', 'Điện Kinh Dịch', 'iching', 3),
('que-dau-ngay', 'Điện Quẻ Đầu Ngày', 'daily-fortune', 4),
('tinh-duyen', 'Điện Tình Duyên', 'love-fortune', 5),
('cong-danh', 'Điện Công Danh', 'career-fortune', 6)
on conflict (slug) do nothing;

create table public.fortune_systems (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  system_type text not null check (
    system_type in ('fortune_sticks','yin_yang','iching','daily','love','career')
  ),
  description text,
  tradition_note text,
  status text not null default 'draft'
    check (status in ('draft','review','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fortunes (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null references public.fortune_systems(id) on delete cascade,
  number int,
  title text not null,
  poem text,
  original_text text,
  meaning text not null,
  advice text,
  source_title text,
  source_url text,
  source_note text,
  editorial_note text,
  content_version int not null default 1 check (content_version > 0),
  status text not null default 'draft'
    check (status in ('draft','review','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index fortunes_system_number_version_uidx
on public.fortunes(system_id, number, content_version)
where number is not null;

create table public.fortune_interpretations (
  id uuid primary key default gen_random_uuid(),
  fortune_id uuid not null references public.fortunes(id) on delete cascade,
  category text not null check (
    category in ('general','love','career','finance','health','family')
  ),
  content text not null,
  disclaimer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(fortune_id, category)
);

create table public.experience_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.experience_rooms(id),
  anonymous_session_hash text not null,
  entered_at timestamptz not null default now(),
  exited_at timestamptz
);

create table public.fortune_sessions (
  id uuid primary key default gen_random_uuid(),
  anonymous_session_hash text not null,
  system_id uuid not null references public.fortune_systems(id),
  fortune_id uuid references public.fortunes(id),
  idempotency_key text not null,
  result jsonb not null,
  method text not null,
  created_at timestamptz not null default now()
);

create unique index fortune_sessions_anon_idempotency_uidx
on public.fortune_sessions(anonymous_session_hash, idempotency_key);

create table public.fortune_draw_steps (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.fortune_sessions(id) on delete cascade,
  step_number int not null check (step_number > 0),
  value text not null,
  is_moving boolean not null default false,
  created_at timestamptz not null default now(),
  unique(session_id, step_number)
);

create table public.daily_fortunes (
  id uuid primary key default gen_random_uuid(),
  fortune_id uuid not null references public.fortunes(id),
  draw_date date not null unique,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  editorial_note text,
  created_at timestamptz not null default now()
);

create table public.scene_assets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  room_id uuid references public.experience_rooms(id),
  name text not null,
  asset_path text not null,
  asset_type text not null check (asset_type in ('model','texture','audio','image')),
  license_name text,
  license_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index fortunes_system_status_idx on public.fortunes(system_id, status);
create index fortune_sessions_anon_created_idx
on public.fortune_sessions(anonymous_session_hash, created_at desc);
create index experience_sessions_anon_idx
on public.experience_sessions(anonymous_session_hash, entered_at desc);
```

## 4. RLS

Bật RLS trên tất cả bảng:

``` sql
alter table public.experience_rooms enable row level security;
alter table public.fortune_systems enable row level security;
alter table public.fortunes enable row level security;
alter table public.fortune_interpretations enable row level security;
alter table public.experience_sessions enable row level security;
alter table public.fortune_sessions enable row level security;
alter table public.fortune_draw_steps enable row level security;
alter table public.daily_fortunes enable row level security;
alter table public.scene_assets enable row level security;
```

Chính sách cần triển khai: - Public đọc room đang active. - Public đọc
system/fortune/interpretation đã published. - Public đọc daily fortune
gắn với nội dung published. - Session ẩn danh chỉ được truy cập qua API
server-side; không cấp quyền đọc/ghi trực tiếp cho client. - Admin CRUD
nội dung qua server-side authorization. - Client không được tự insert
kết quả quẻ chính thức. - `service_role` chỉ server-side.

Ví dụ policy public:

``` sql
create policy "public read active rooms"
on public.experience_rooms for select
using (is_active = true);

create policy "public read published systems"
on public.fortune_systems for select
using (status = 'published');

create policy "public read published fortunes"
on public.fortunes for select
using (
  status = 'published'
  and exists (
    select 1 from public.fortune_systems s
    where s.id = system_id and s.status = 'published'
  )
);

create policy "public read published interpretations"
on public.fortune_interpretations for select
using (
  exists (
    select 1 from public.fortunes f
    join public.fortune_systems s on s.id = f.system_id
    where f.id = fortune_id
      and f.status = 'published'
      and s.status = 'published'
  )
);
```

Không có tài khoản hồ sơ cho người dùng cuối. Nếu bật trang admin, xác
thực quản trị viên phải được kiểm tra server-side bằng cơ chế riêng;
không cấp quyền quản trị dựa trên metadata do client tự sửa.

## 5. Lưu ý schema

-   Bảng trên là nền tảng khởi đầu, cần review trước production.
-   `fortune_sessions.result` lưu snapshot JSON để lịch sử không thay
    đổi khi nội dung được biên tập.
-   `anonymous_session_hash` là định danh giả danh do server quản lý để
    giới hạn idempotency; không dùng như tài khoản hoặc cơ chế đăng nhập.
    Cần chốt thời hạn lưu/xóa các session trước production.
-   Lịch sử người dùng (nếu bật) chỉ lưu trên browser storage của thiết
    bị hiện tại; không được coi đó là bản sao lưu hoặc lịch sử đồng bộ.
-   Với Kinh Dịch, `fortune_draw_steps` lưu sáu hào theo thứ tự gieo;
    quy tắc mapping phải được test.
-   Với Âm Dương, `result` cần lưu phương pháp, từng lượt và tổng kết.
-   Với quẻ đầu ngày, `draw_date` là ngày tại múi giờ
    `Asia/Ho_Chi_Minh`.
-   Không lưu lời nguyện mặc định.
-   Cần thêm policy riêng cho `fortune_draw_steps`, `daily_fortunes`,
    `scene_assets` trước khi bật production.
