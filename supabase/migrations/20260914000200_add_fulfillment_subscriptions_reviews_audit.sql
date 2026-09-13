create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_user_id uuid references auth.users(id),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  dairywala_id uuid not null references public.dairywala_profiles(id) on delete cascade,
  delivery_slot_id uuid references public.dairywala_delivery_slots(id) on delete set null,
  route_date date not null,
  status text not null default 'PLANNED' check (status in ('PLANNED','IN_PROGRESS','COMPLETED','CANCELLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  stop_sequence integer not null check (stop_sequence > 0),
  status text not null default 'PENDING' check (status in ('PENDING','OUT_FOR_DELIVERY','DELIVERED','FAILED','SKIPPED')),
  delivered_at timestamptz,
  note text,
  unique(route_id, order_id),
  unique(route_id, stop_sequence)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  dairywala_id uuid not null references public.dairywala_profiles(id) on delete restrict,
  delivery_slot_id uuid not null references public.dairywala_delivery_slots(id) on delete restrict,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','PAUSED','SKIPPED','CANCELLED')),
  start_date date not null default current_date,
  quantity integer not null check (quantity > 0),
  frequency_days integer[] not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_items (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique(subscription_id, product_id)
);

create table if not exists public.subscription_schedule (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  scheduled_for date not null,
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED','ORDER_CREATED','SKIPPED','CANCELLED')),
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(subscription_id, scheduled_for)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  dairywala_id uuid not null references public.dairywala_profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(order_id, customer_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_idx on public.order_status_history(order_id, created_at);
create index if not exists routes_dairywala_date_idx on public.routes(dairywala_id, route_date);
create index if not exists route_stops_route_idx on public.route_stops(route_id, stop_sequence);
create index if not exists subscriptions_customer_idx on public.subscriptions(customer_id, status);
create index if not exists subscription_schedule_date_idx on public.subscription_schedule(scheduled_for, status);
create index if not exists reviews_dairywala_idx on public.reviews(dairywala_id, created_at);
create index if not exists notifications_user_idx on public.notifications(user_id, read_at, created_at);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at);

alter table public.order_status_history enable row level security;
alter table public.routes enable row level security;
alter table public.route_stops enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_items enable row level security;
alter table public.subscription_schedule enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "customers view own order status history" on public.order_status_history for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and o.customer_id=auth.uid()));
create policy "customers manage own subscriptions" on public.subscriptions for all to authenticated using (customer_id=auth.uid()) with check (customer_id=auth.uid());
create policy "customers view own subscription items" on public.subscription_items for select to authenticated using (exists(select 1 from public.subscriptions s where s.id=subscription_id and s.customer_id=auth.uid()));
create policy "customers view own subscription schedule" on public.subscription_schedule for select to authenticated using (exists(select 1 from public.subscriptions s where s.id=subscription_id and s.customer_id=auth.uid()));
create policy "customers create own reviews" on public.reviews for insert to authenticated with check (customer_id=auth.uid() and exists(select 1 from public.orders o where o.id=order_id and o.customer_id=auth.uid() and o.dairywala_id=dairywala_id and o.status='COMPLETED'));
create policy "customers view reviews" on public.reviews for select to authenticated using (true);
create policy "users view own notifications" on public.notifications for select to authenticated using (user_id=auth.uid());
create policy "users update own notifications" on public.notifications for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

create or replace function public.transition_order_status(p_order_id uuid, p_to_status text, p_note text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_order public.orders%rowtype; v_allowed boolean:=false; v_actor uuid:=auth.uid();
begin
 select * into v_order from public.orders where id=p_order_id for update;
 if not found then raise exception 'Order not found'; end if;
 if v_actor is null then raise exception 'Authentication required'; end if;
 if v_order.customer_id=v_actor then
   v_allowed := (v_order.status='OUT_FOR_DELIVERY' and p_to_status='DELIVERED') or (v_order.status='DELIVERED' and p_to_status='COMPLETED');
 else
   v_allowed := true;
 end if;
 if not v_allowed then raise exception 'Order transition not permitted'; end if;
 insert into public.order_status_history(order_id,from_status,to_status,actor_user_id,note) values(v_order.id,v_order.status,p_to_status,v_actor,p_note);
 update public.orders set status=p_to_status, updated_at=now() where id=v_order.id;
 return v_order.id;
end; $$;
grant execute on function public.transition_order_status(uuid,text,text) to authenticated;

create or replace function public.create_route_for_dairywala(p_dairywala_id uuid,p_delivery_slot_id uuid,p_route_date date)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_route uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 insert into public.routes(dairywala_id,delivery_slot_id,route_date) values(p_dairywala_id,p_delivery_slot_id,p_route_date) returning id into v_route;
 return v_route;
end; $$;
grant execute on function public.create_route_for_dairywala(uuid,uuid,date) to authenticated;

create or replace function public.schedule_subscription(p_customer_id uuid,p_dairywala_id uuid,p_delivery_slot_id uuid,p_quantity integer,p_frequency_days integer[],p_product_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_sub uuid;
begin
 if auth.uid() is null or auth.uid()<>p_customer_id then raise exception 'Not permitted'; end if;
 insert into public.subscriptions(customer_id,dairywala_id,delivery_slot_id,quantity,frequency_days) values(p_customer_id,p_dairywala_id,p_delivery_slot_id,p_quantity,p_frequency_days) returning id into v_sub;
 insert into public.subscription_items(subscription_id,product_id,quantity) values(v_sub,p_product_id,p_quantity);
 return v_sub;
end; $$;
grant execute on function public.schedule_subscription(uuid,uuid,uuid,integer,integer[],uuid) to authenticated;

create or replace function public.generate_subscription_schedule(p_from date,p_to date)
returns integer language plpgsql security definer set search_path=public as $$
declare v_count integer;
begin
 insert into public.subscription_schedule(subscription_id,scheduled_for)
 select s.id,d::date from public.subscriptions s cross join lateral generate_series(greatest(s.start_date,p_from),p_to,interval '1 day') d
 where s.status='ACTIVE' and extract(isodow from d)::integer = any(s.frequency_days)
 on conflict(subscription_id,scheduled_for) do nothing;
 get diagnostics v_count=row_count; return v_count;
end; $$;
grant execute on function public.generate_subscription_schedule(date,date) to service_role;

create or replace function public.mark_route_stop_delivered(p_stop_id uuid,p_note text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_order uuid;
begin
 select order_id into v_order from public.route_stops where id=p_stop_id for update;
 if v_order is null then raise exception 'Stop not found'; end if;
 update public.route_stops set status='DELIVERED',delivered_at=now(),note=p_note where id=p_stop_id;
 update public.orders set status='DELIVERED',updated_at=now() where id=v_order and status in ('OUT_FOR_DELIVERY','FULFILLING');
 insert into public.order_status_history(order_id,from_status,to_status,actor_user_id,note) values(v_order,'OUT_FOR_DELIVERY','DELIVERED',auth.uid(),p_note);
 return v_order;
end; $$;
grant execute on function public.mark_route_stop_delivered(uuid,text) to authenticated;
