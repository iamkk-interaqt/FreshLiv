create table if not exists public.notification_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null,
  platform text not null check (platform in ('android', 'ios', 'web')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

create index if not exists notification_devices_user_id_idx
  on public.notification_devices(user_id);

create index if not exists notification_devices_enabled_idx
  on public.notification_devices(enabled)
  where enabled = true;

alter table public.notification_devices enable row level security;

create policy "users manage own notification devices"
  on public.notification_devices
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.touch_notification_device_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notification_devices_touch_updated_at on public.notification_devices;
create trigger notification_devices_touch_updated_at
before update on public.notification_devices
for each row execute function public.touch_notification_device_updated_at();
