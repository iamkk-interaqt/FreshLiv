-- Production hardening for notifications, reviews, and subscription scheduling.

create index if not exists notifications_unread_idx
  on public.notifications(user_id, created_at desc)
  where read_at is null;

create index if not exists subscription_schedule_due_idx
  on public.subscription_schedule(scheduled_for, status, subscription_id);

create or replace function public.mark_notification_read(p_notification_id uuid)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.notifications
     set read_at = coalesce(read_at, now())
   where id = p_notification_id
     and user_id = auth.uid();
  if not found then raise exception 'Notification not found'; end if;
  return p_notification_id;
end;
$$;
grant execute on function public.mark_notification_read(uuid) to authenticated;

create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare v_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.notifications
     set read_at = now()
   where user_id = auth.uid()
     and read_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
grant execute on function public.mark_all_notifications_read() to authenticated;

create or replace function public.create_order_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_data jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare v_id uuid;
begin
  if p_user_id is null then raise exception 'Recipient required'; end if;
  insert into public.notifications(user_id,type,title,body,data)
  values(p_user_id,p_type,p_title,p_body,coalesce(p_data,'{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.create_order_notification(uuid,text,text,text,jsonb) to service_role;

create or replace function public.create_review(
  p_order_id uuid,
  p_rating integer,
  p_comment text default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_order public.orders%rowtype;
  v_review uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_rating < 1 or p_rating > 5 then raise exception 'Rating must be between 1 and 5'; end if;

  select * into v_order
    from public.orders
   where id=p_order_id
     and customer_id=auth.uid()
     and status='COMPLETED'
   for update;

  if not found then raise exception 'Only your completed orders can be reviewed'; end if;
  if exists(select 1 from public.reviews where order_id=p_order_id and customer_id=auth.uid()) then
    raise exception 'Order already reviewed';
  end if;

  insert into public.reviews(order_id,customer_id,dairywala_id,rating,comment)
  values(p_order_id,auth.uid(),v_order.dairywala_id,p_rating,nullif(trim(p_comment),''))
  returning id into v_review;

  return v_review;
end;
$$;
grant execute on function public.create_review(uuid,integer,text) to authenticated;

create or replace function public.generate_subscription_schedule_window(
  p_from date default current_date,
  p_days integer default 14
)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare v_to date; v_count integer;
begin
  if p_days < 1 or p_days > 90 then raise exception 'Schedule window must be 1-90 days'; end if;
  v_to := p_from + (p_days - 1);
  insert into public.subscription_schedule(subscription_id,scheduled_for)
  select s.id,d::date
    from public.subscriptions s
    cross join lateral generate_series(greatest(s.start_date,p_from),v_to,interval '1 day') d
   where s.status='ACTIVE'
     and extract(isodow from d)::integer = any(s.frequency_days)
  on conflict(subscription_id,scheduled_for) do nothing;
  get diagnostics v_count=row_count;
  return v_count;
end;
$$;
grant execute on function public.generate_subscription_schedule_window(date,integer) to service_role;
