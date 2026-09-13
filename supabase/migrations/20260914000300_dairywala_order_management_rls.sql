create policy "dairywalas can read own orders"
on public.orders
for select
to authenticated
using (
  exists (
    select 1 from public.dairywala_profiles d
    where d.id = orders.dairywala_id
      and d.owner_user_id = auth.uid()
  )
);

create policy "dairywalas can update own orders"
on public.orders
for update
to authenticated
using (
  exists (
    select 1 from public.dairywala_profiles d
    where d.id = orders.dairywala_id
      and d.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.dairywala_profiles d
    where d.id = orders.dairywala_id
      and d.owner_user_id = auth.uid()
  )
);

create policy "dairywalas can add order history"
on public.order_status_history
for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and exists (
    select 1
    from public.orders o
    join public.dairywala_profiles d on d.id = o.dairywala_id
    where o.id = order_status_history.order_id
      and d.owner_user_id = auth.uid()
  )
);

create policy "dairywalas can notify customers"
on public.notifications
for insert
to authenticated
with check (
  exists (
    select 1
    from public.orders o
    join public.dairywala_profiles d on d.id = o.dairywala_id
    where o.id::text = notifications.data->>'orderId'
      and d.owner_user_id = auth.uid()
  )
);
