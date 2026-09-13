-- Gwalawala: secure Dairywala route access and stop transitions

create policy "dairywalas view own routes"
on public.routes for select to authenticated
using (exists (
  select 1 from public.dairywala_profiles dp
  where dp.id = dairywala_id and dp.owner_user_id = auth.uid()
));

create policy "dairywalas view own route stops"
on public.route_stops for select to authenticated
using (exists (
  select 1 from public.routes r
  join public.dairywala_profiles dp on dp.id = r.dairywala_id
  where r.id = route_id and dp.owner_user_id = auth.uid()
));

create or replace function public.set_route_status(p_route_id uuid, p_status text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_route uuid;
begin
  if p_status not in ('PLANNED','IN_PROGRESS','COMPLETED','CANCELLED') then
    raise exception 'Invalid route status';
  end if;
  update public.routes r
  set status = p_status, updated_at = now()
  where r.id = p_route_id
    and exists (
      select 1 from public.dairywala_profiles dp
      where dp.id = r.dairywala_id and dp.owner_user_id = auth.uid()
    )
  returning r.id into v_route;
  if v_route is null then raise exception 'Route not found or not permitted'; end if;
  return v_route;
end;
$$;

revoke all on function public.set_route_status(uuid,text) from public;
grant execute on function public.set_route_status(uuid,text) to authenticated;

create or replace function public.mark_route_stop_out_for_delivery(p_stop_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_stop uuid;
begin
  update public.route_stops rs
  set status = 'OUT_FOR_DELIVERY'
  where rs.id = p_stop_id
    and rs.status = 'PENDING'
    and exists (
      select 1 from public.routes r
      join public.dairywala_profiles dp on dp.id = r.dairywala_id
      where r.id = rs.route_id and dp.owner_user_id = auth.uid()
    )
  returning rs.id into v_stop;
  if v_stop is null then raise exception 'Stop not found or not permitted'; end if;
  return v_stop;
end;
$$;

revoke all on function public.mark_route_stop_out_for_delivery(uuid) from public;
grant execute on function public.mark_route_stop_out_for_delivery(uuid) to authenticated;

create or replace function public.mark_route_stop_delivered(p_stop_id uuid,p_note text default null)
returns uuid
language plpgsql security definer set search_path=public as $$
declare v_order uuid; v_stop uuid; v_from_status text;
begin
  select rs.order_id, rs.id, rs.status into v_order, v_stop, v_from_status
  from public.route_stops rs
  join public.routes r on r.id = rs.route_id
  join public.dairywala_profiles dp on dp.id = r.dairywala_id
  where rs.id = p_stop_id and dp.owner_user_id = auth.uid()
  for update;
  if v_order is null then raise exception 'Stop not found or not permitted'; end if;
  update public.route_stops set status='DELIVERED', delivered_at=now(), note=p_note where id=v_stop;
  update public.orders set status='DELIVERED', updated_at=now() where id=v_order and status in ('OUT_FOR_DELIVERY','FULFILLING');
  insert into public.order_status_history(order_id,from_status,to_status,actor_user_id,note)
  values(v_order,coalesce(v_from_status,'OUT_FOR_DELIVERY'),'DELIVERED',auth.uid(),p_note);
  return v_order;
end;
$$;

revoke all on function public.mark_route_stop_delivered(uuid,text) from public;
grant execute on function public.mark_route_stop_delivered(uuid,text) to authenticated;
