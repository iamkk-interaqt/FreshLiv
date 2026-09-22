-- Preserve the existing order flow while adding server-side category integrity.
create or replace function public.create_customer_order(
  p_dairywala_id uuid, p_address_id uuid, p_delivery_slot_id uuid, p_items jsonb,
  p_customer_type text default 'HOME', p_order_type text default 'STANDARD',
  p_purchase_category text default null, p_purchase_requirement text default null
) returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid(); v_order_id uuid; v_subtotal numeric := 0; v_delivery numeric := 0;
  v_total numeric := 0; v_fee numeric := 0; v_item jsonb; v_product_id uuid; v_qty numeric; v_price numeric; v_prod_row record;
begin
  if v_uid is null then raise exception 'Please sign in to place an order' using errcode='42501'; end if;
  if p_customer_type not in ('HOME','BUSINESS') then raise exception 'Invalid customer type' using errcode='22023'; end if;
  if p_order_type not in ('STANDARD','ONE_TIME_BULK','RECURRING_BULK') then raise exception 'Invalid order type' using errcode='22023'; end if;
  if p_customer_type='HOME' and p_order_type <> 'STANDARD' then raise exception 'Home orders cannot use business bulk order types' using errcode='22023'; end if;
  if p_customer_type='BUSINESS' and p_order_type='STANDARD' then raise exception 'Business orders must select a bulk order type' using errcode='22023'; end if;
  if not exists (select 1 from public.customer_addresses where id=p_address_id and customer_id=v_uid) then raise exception 'Delivery address is not yours or does not exist' using errcode='22023'; end if;
  if not exists (select 1 from public.dairywala_delivery_slots where id=p_delivery_slot_id and dairywala_id=p_dairywala_id and active=true) then raise exception 'Delivery slot is not available for this Dairywala' using errcode='22023'; end if;
  if p_items is null or jsonb_array_length(p_items)=0 then raise exception 'Your cart is empty' using errcode='22023'; end if;
  if p_customer_type='BUSINESS' and p_order_type='ONE_TIME_BULK' then v_fee := coalesce(public.get_monetization_amount('bulk_one_time_fee'),99);
  elsif p_customer_type='BUSINESS' and p_order_type='RECURRING_BULK' then
    if not public.is_gwalawala_plus(v_uid) then raise exception 'FreshLiv Plus is required for recurring bulk orders' using errcode='42501'; end if;
    v_fee := 0;
  end if;
  insert into public.customer_profiles(user_id) values(v_uid) on conflict(user_id) do nothing;
  insert into public.orders(customer_id,dairywala_id,address_id,delivery_slot_id,status,subtotal,delivery_fee,total_amount,customer_type,order_type,purchase_category,purchase_requirement,bulk_service_fee)
  values(v_uid,p_dairywala_id,p_address_id,p_delivery_slot_id,'PAYMENT_PENDING',0,0,0,p_customer_type,p_order_type,p_purchase_category,p_purchase_requirement,v_fee) returning id into v_order_id;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid; v_qty := coalesce((v_item->>'quantity')::numeric,0);
    if v_qty <= 0 then raise exception 'Quantity must be greater than zero' using errcode='22023'; end if;
    select id,price,dairywala_id,status::text as status_txt,name,bulk_order_enabled,product_category into v_prod_row from public.products where id=v_product_id;
    if not found then raise exception 'Product not found (%)',v_product_id using errcode='22023'; end if;
    if v_prod_row.dairywala_id <> p_dairywala_id then raise exception 'Product % is not from this Dairywala',coalesce(v_prod_row.name,'') using errcode='22023'; end if;
    if v_prod_row.status_txt <> 'ACTIVE' then raise exception 'Product % is not available right now',coalesce(v_prod_row.name,'') using errcode='22023'; end if;
    if p_purchase_category is not null and upper(coalesce(v_prod_row.product_category,'')) <> upper(p_purchase_category) then raise exception 'Product category does not match this purchase' using errcode='22023'; end if;
    if p_customer_type='BUSINESS' and not coalesce(v_prod_row.bulk_order_enabled,false) then raise exception 'Product % is not enabled for business bulk ordering',coalesce(v_prod_row.name,'') using errcode='22023'; end if;
    v_price := coalesce(v_prod_row.price,0); v_subtotal := v_subtotal + v_price*v_qty;
    insert into public.order_items(order_id,product_id,quantity,unit_price,line_total) values(v_order_id,v_product_id,v_qty,v_price,v_price*v_qty);
  end loop;
  v_total := v_subtotal + v_delivery + v_fee;
  update public.orders set subtotal=v_subtotal,delivery_fee=v_delivery,total_amount=v_total,bulk_service_fee=v_fee,updated_at=now() where id=v_order_id;
  insert into public.payment_transactions(order_id,provider,amount,currency,status) values(v_order_id,'CASHFREE',v_total,'INR','CREATED');
  if to_regclass('public.order_status_history') is not null then insert into public.order_status_history(order_id,from_status,to_status,actor_user_id,note) values(v_order_id,null,'PAYMENT_PENDING',v_uid,'Placed via customer app'); end if;
  return v_order_id;
end; $$;