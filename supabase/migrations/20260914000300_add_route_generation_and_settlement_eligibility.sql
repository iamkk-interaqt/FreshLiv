-- Gwalawala: route generation + settlement eligibility
-- Production contains no seed/test data. Functions only act on real rows.

create or replace function public.generate_dairywala_route(
  p_dairywala_id uuid,
  p_delivery_slot_id uuid,
  p_route_date date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_route_id uuid;
begin
  if not exists (
    select 1 from public.dairywala_profiles
    where id = p_dairywala_id and owner_user_id = auth.uid()
  ) then
    raise exception 'Not authorized for this Dairywala';
  end if;

  insert into public.routes (dairywala_id, delivery_slot_id, route_date, status)
  values (p_dairywala_id, p_delivery_slot_id, p_route_date, 'PLANNED')
  on conflict do nothing
  returning id into v_route_id;

  if v_route_id is null then
    select id into v_route_id
    from public.routes
    where dairywala_id = p_dairywala_id
      and delivery_slot_id = p_delivery_slot_id
      and route_date = p_route_date
    limit 1;
  end if;

  insert into public.route_stops (route_id, order_id, stop_sequence, status)
  select
    v_route_id,
    o.id,
    row_number() over (order by o.created_at, o.id)::integer,
    'PENDING'
  from public.orders o
  where o.dairywala_id = p_dairywala_id
    and o.delivery_slot_id = p_delivery_slot_id
    and o.status in ('CONFIRMED','ACCEPTED','FULFILLING','OUT_FOR_DELIVERY')
    and not exists (
      select 1 from public.route_stops rs where rs.order_id = o.id
    )
  order by o.created_at, o.id;

  return v_route_id;
end;
$$;

revoke all on function public.generate_dairywala_route(uuid,uuid,date) from public;
grant execute on function public.generate_dairywala_route(uuid,uuid,date) to authenticated;

create or replace function public.mark_completed_orders_settlement_eligible()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  update public.marketplace_order_splits mos
  set provider_status = 'ELIGIBLE', updated_at = now()
  from public.orders o
  where mos.order_id = o.id
    and o.status = 'COMPLETED'
    and mos.provider_status in ('PENDING','CREATED','RECONCILIATION_PENDING')
    and exists (
      select 1 from public.payment_transactions pt
      where pt.order_id = o.id
        and pt.status = 'CAPTURED'
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.mark_completed_orders_settlement_eligible() from public;
grant execute on function public.mark_completed_orders_settlement_eligible() to service_role;

create index if not exists routes_dairywala_date_slot_idx
  on public.routes(dairywala_id, route_date, delivery_slot_id);

create index if not exists route_stops_order_idx
  on public.route_stops(order_id);
