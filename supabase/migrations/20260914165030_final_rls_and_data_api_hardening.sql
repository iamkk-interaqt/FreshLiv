begin;

do $$
declare r record;
begin
  for r in select table_schema, table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' loop
    execute format('revoke all on table %I.%I from anon, authenticated', r.table_schema, r.table_name);
  end loop;
end $$;

grant select on table public.dairywala_profiles, public.dairywala_service_areas, public.dairywala_delivery_slots, public.products to anon;
grant select, update on table public.profiles to authenticated;
grant select on table public.user_roles, public.customer_profiles, public.dairywala_profiles, public.dairywala_applications, public.dairywala_service_areas, public.dairywala_delivery_slots, public.dairywala_settlement_profiles, public.marketplace_commission_rules, public.marketplace_order_splits, public.marketplace_settlement_events, public.order_items, public.order_status_history, public.orders, public.payment_transactions, public.reviews, public.route_stops, public.routes, public.subscription_items, public.subscription_schedule, public.subscriptions to authenticated;
grant select, insert, update, delete on table public.customer_addresses to authenticated;
grant select, insert, update, delete on table public.products to authenticated;
grant select, update on table public.notifications to authenticated;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

drop policy if exists "customers can create own addresses" on public.customer_addresses;
drop policy if exists "customers can read own addresses" on public.customer_addresses;
drop policy if exists "customers can update own addresses" on public.customer_addresses;
alter policy "customer_addresses_own" on public.customer_addresses to authenticated using ((select auth.uid()) = customer_id or (select is_admin())) with check ((select auth.uid()) = customer_id or (select is_admin()));

drop policy if exists "dairywala_read_owner_or_admin" on public.dairywala_profiles;
alter policy "dairywala_public_discovery" on public.dairywala_profiles to anon, authenticated using ((status='ACTIVE'::public.dairywala_status) or owner_user_id=(select auth.uid()) or (select is_admin()));

alter policy "slots_public_active" on public.dairywala_delivery_slots to anon, authenticated using ((exists (select 1 from public.dairywala_profiles d where d.id=dairywala_delivery_slots.dairywala_id and d.status='ACTIVE')) or (select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=dairywala_delivery_slots.dairywala_id and d.owner_user_id=(select auth.uid())));
drop policy if exists "slots_owner_or_admin" on public.dairywala_delivery_slots;
create policy "slots_owner_or_admin_insert" on public.dairywala_delivery_slots for insert to authenticated with check ((select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=dairywala_delivery_slots.dairywala_id and d.owner_user_id=(select auth.uid())));
create policy "slots_owner_or_admin_update" on public.dairywala_delivery_slots for update to authenticated using ((select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=dairywala_delivery_slots.dairywala_id and d.owner_user_id=(select auth.uid()))) with check ((select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=dairywala_delivery_slots.dairywala_id and d.owner_user_id=(select auth.uid())));
create policy "slots_owner_or_admin_delete" on public.dairywala_delivery_slots for delete to authenticated using ((select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=dairywala_delivery_slots.dairywala_id and d.owner_user_id=(select auth.uid())));

alter policy "service_area_public_active" on public.dairywala_service_areas to anon, authenticated using ((exists (select 1 from public.dairywala_profiles d where d.id=dairywala_service_areas.dairywala_id and d.status='ACTIVE')) or (select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=dairywala_service_areas.dairywala_id and d.owner_user_id=(select auth.uid())));
drop policy if exists "service_area_owner_or_admin" on public.dairywala_service_areas;
create policy "service_area_owner_or_admin_insert" on public.dairywala_service_areas for insert to authenticated with check ((select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=dairywala_service_areas.dairywala_id and d.owner_user_id=(select auth.uid())));
create policy "service_area_owner_or_admin_update" on public.dairywala_service_areas for update to authenticated using ((select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=dairywala_service_areas.dairywala_id and d.owner_user_id=(select auth.uid()))) with check ((select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=dairywala_service_areas.dairywala_id and d.owner_user_id=(select auth.uid())));
create policy "service_area_owner_or_admin_delete" on public.dairywala_service_areas for delete to authenticated using ((select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=dairywala_service_areas.dairywala_id and d.owner_user_id=(select auth.uid())));

drop policy if exists "products_owner_or_admin" on public.products;
create policy "products_owner_or_admin_insert" on public.products for insert to authenticated with check ((select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=products.dairywala_id and d.owner_user_id=(select auth.uid()) and d.status='ACTIVE'));
create policy "products_owner_or_admin_update" on public.products for update to authenticated using ((select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=products.dairywala_id and d.owner_user_id=(select auth.uid()))) with check ((select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=products.dairywala_id and d.owner_user_id=(select auth.uid())));
create policy "products_owner_or_admin_delete" on public.products for delete to authenticated using ((select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=products.dairywala_id and d.owner_user_id=(select auth.uid())));
alter policy "products_public_active" on public.products to anon, authenticated using (((status='ACTIVE'::public.product_status) and exists (select 1 from public.dairywala_profiles d where d.id=products.dairywala_id and d.status='ACTIVE')) or (select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=products.dairywala_id and d.owner_user_id=(select auth.uid())));

-- Merge role-specific SELECT policies into one policy per table, while keeping writes role-specific.
drop policy if exists "admins manage settlement profiles" on public.dairywala_settlement_profiles;
drop policy if exists "Dairywalas can view own settlement profile" on public.dairywala_settlement_profiles;
drop policy if exists "dairywala reads own settlement profile" on public.dairywala_settlement_profiles;
create policy "settlement_profiles_select" on public.dairywala_settlement_profiles for select to authenticated using ((select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=dairywala_settlement_profiles.dairywala_id and d.owner_user_id=(select auth.uid())));
create policy "settlement_profiles_admin_insert" on public.dairywala_settlement_profiles for insert to authenticated with check ((select is_admin()));
create policy "settlement_profiles_admin_update" on public.dairywala_settlement_profiles for update to authenticated using ((select is_admin())) with check ((select is_admin()));
create policy "settlement_profiles_admin_delete" on public.dairywala_settlement_profiles for delete to authenticated using ((select is_admin()));

drop policy if exists "Dairywalas can view own marketplace splits" on public.marketplace_order_splits;
drop policy if exists "admins manage splits" on public.marketplace_order_splits;
drop policy if exists "customers view own splits" on public.marketplace_order_splits;
drop policy if exists "dairywalas view own splits" on public.marketplace_order_splits;
create policy "marketplace_splits_select" on public.marketplace_order_splits for select to authenticated using ((select is_admin()) or exists (select 1 from public.orders o where o.id=marketplace_order_splits.order_id and o.customer_id=(select auth.uid())) or exists (select 1 from public.dairywala_profiles d where d.id=marketplace_order_splits.dairywala_id and d.owner_user_id=(select auth.uid())));
create policy "marketplace_splits_admin_insert" on public.marketplace_order_splits for insert to authenticated with check ((select is_admin()));
create policy "marketplace_splits_admin_update" on public.marketplace_order_splits for update to authenticated using ((select is_admin())) with check ((select is_admin()));
create policy "marketplace_splits_admin_delete" on public.marketplace_order_splits for delete to authenticated using ((select is_admin()));

drop policy if exists "Dairywalas can view own settlement events" on public.marketplace_settlement_events;
drop policy if exists "admins view settlement events" on public.marketplace_settlement_events;
create policy "settlement_events_select" on public.marketplace_settlement_events for select to authenticated using ((select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=marketplace_settlement_events.dairywala_id and d.owner_user_id=(select auth.uid())));

drop policy if exists "admins can view orders" on public.orders;
drop policy if exists "customers can read own orders" on public.orders;
drop policy if exists "dairywalas can read own orders" on public.orders;
create policy "orders_select" on public.orders for select to authenticated using ((select is_admin()) or customer_id=(select auth.uid()) or exists (select 1 from public.dairywala_profiles d where d.id=orders.dairywala_id and d.owner_user_id=(select auth.uid())));

drop policy if exists "Customers can view own payment transactions" on public.payment_transactions;
drop policy if exists "admins can view payments" on public.payment_transactions;
create policy "payments_select" on public.payment_transactions for select to authenticated using ((select is_admin()) or exists (select 1 from public.orders o where o.id=payment_transactions.order_id and o.customer_id=(select auth.uid())));

drop policy if exists "admins can view routes" on public.routes;
drop policy if exists "dairywalas view own routes" on public.routes;
create policy "routes_select" on public.routes for select to authenticated using ((select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=routes.dairywala_id and d.owner_user_id=(select auth.uid())));

drop policy if exists "admins can view subscriptions" on public.subscriptions;
drop policy if exists "customers view own subscriptions" on public.subscriptions;
create policy "subscriptions_select" on public.subscriptions for select to authenticated using ((select is_admin()) or customer_id=(select auth.uid()));

drop policy if exists "admins can view reviews" on public.reviews;
alter policy "customers view reviews" on public.reviews to authenticated using (true);

alter policy "profiles_select_own" on public.profiles to authenticated using ((id=(select auth.uid())) or (select is_admin()));
alter policy "profiles_update_own" on public.profiles to authenticated using ((id=(select auth.uid())) or (select is_admin())) with check ((id=(select auth.uid())) or (select is_admin()));
alter policy "roles_select_own_or_admin" on public.user_roles to authenticated using ((user_id=(select auth.uid())) or (select is_admin()));
alter policy "customer_profile_own" on public.customer_profiles to authenticated using ((user_id=(select auth.uid())) or (select is_admin())) with check ((user_id=(select auth.uid())) or (select is_admin()));
alter policy "applications_owner_or_admin" on public.dairywala_applications to authenticated using ((select is_admin()) or exists (select 1 from public.dairywala_profiles d where d.id=dairywala_applications.dairywala_id and d.owner_user_id=(select auth.uid())));
alter policy "users update own notifications" on public.notifications to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
alter policy "users view own notifications" on public.notifications to authenticated using (user_id=(select auth.uid()));
alter policy "customers can read own order items" on public.order_items to authenticated using (exists (select 1 from public.orders o where o.id=order_items.order_id and o.customer_id=(select auth.uid())));
alter policy "customers view own order status history" on public.order_status_history to authenticated using (exists (select 1 from public.orders o where o.id=order_status_history.order_id and o.customer_id=(select auth.uid())));
alter policy "dairywalas view own route stops" on public.route_stops to authenticated using (exists (select 1 from public.routes r join public.dairywala_profiles dp on dp.id=r.dairywala_id where r.id=route_stops.route_id and dp.owner_user_id=(select auth.uid())));
alter policy "customers view own subscription items" on public.subscription_items to authenticated using (exists (select 1 from public.subscriptions s where s.id=subscription_items.subscription_id and s.customer_id=(select auth.uid())));
alter policy "customers view own subscription schedule" on public.subscription_schedule to authenticated using (exists (select 1 from public.subscriptions s where s.id=subscription_schedule.subscription_id and s.customer_id=(select auth.uid())));
alter policy "admins can view audit logs" on public.audit_logs to authenticated using ((select is_admin()));

commit;