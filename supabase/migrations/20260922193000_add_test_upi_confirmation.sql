-- Test-only UPI payment confirmation.
-- Production payment remains Cashfree; this function is intentionally isolated for QA/testing.
create or replace function public.confirm_test_upi_payment(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_order public.orders%rowtype;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id and customer_id = v_user
  for update;

  if not found then raise exception 'Order not found'; end if;

  if v_order.status <> 'PAYMENT_PENDING' then
    if v_order.status in ('PAYMENT_VERIFIED','PLACED','CONFIRMED') then return true; end if;
    raise exception 'Order is not awaiting payment';
  end if;

  update public.payment_transactions
  set provider='TEST_UPI',
      provider_order_id='TEST-UPI-' || p_order_id::text,
      provider_payment_id='TEST-UPI-PAY-' || p_order_id::text,
      status='VERIFIED',
      updated_at=now()
  where order_id=p_order_id and status in ('CREATED','PENDING','PROCESSING');

  if not found then
    insert into public.payment_transactions(order_id,provider,provider_order_id,provider_payment_id,amount,currency,status)
    values(p_order_id,'TEST_UPI','TEST-UPI-' || p_order_id::text,'TEST-UPI-PAY-' || p_order_id::text,v_order.total_amount,'INR','VERIFIED');
  end if;

  update public.orders set status='PAYMENT_VERIFIED',updated_at=now() where id=p_order_id;
  return true;
end;
$$;

revoke all on function public.confirm_test_upi_payment(uuid) from public;
grant execute on function public.confirm_test_upi_payment(uuid) to authenticated;