-- Quick Links 사용 빈도 추적
alter table public.quick_links
  add column if not exists click_count integer not null default 0;

-- 대시보드 히어로 커스텀 문구 저장
create table if not exists public.dashboard_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  hero_message text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.dashboard_settings enable row level security;

create policy "dashboard_settings_select_own"
  on public.dashboard_settings for select
  using (auth.uid() = user_id);

create policy "dashboard_settings_insert_own"
  on public.dashboard_settings for insert
  with check (auth.uid() = user_id);

create policy "dashboard_settings_update_own"
  on public.dashboard_settings for update
  using (auth.uid() = user_id);
