create unique index if not exists payment_transactions_one_captured_per_order_idx on public.payment_transactions(order_id) where status='CAPTURED';

create or replace function public.mark_cashfree_payment_captured(
  p_order_id uuid,
  p_provider_order_id text,
  p_provider_payment_id text,
  p_amount numeric,
  p_currency text default 'INR'
) returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_order public.orders%rowtype;
  v_tx public.payment_transactions%rowtype;
  v_existing public.payment_transactions%rowtype;
begin
  if p_order_id is null or nullif(trim(p_provider_order_id),'') is null or nullif(trim(p_provider_payment_id),'') is null then
    raise exception 'Missing Cashfree payment identifiers';
  end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Invalid Cashfree payment amount'; end if;
  if upper(coalesce(p_currency,'')) <> 'INR' then raise exception 'Unsupported payment currency'; end if;

  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if round(v_order.total_amount,2) <> round(p_amount,2) then
    raise exception 'Cashfree payment amount does not match order total';
  end if;

  select * into v_tx
  from public.payment_transactions
  where order_id=p_order_id and provider='CASHFREE' and provider_order_id=p_provider_order_id
  for update;
  if not found then raise exception 'Cashfree payment transaction not found'; end if;

  if round(v_tx.amount,2) <> round(v_order.total_amount,2) or upper(v_tx.currency) <> 'INR' then
    raise exception 'Stored payment transaction does not match order total';
  end if;

  if v_tx.status='CAPTURED' then
    if v_tx.provider_payment_id is not null and v_tx.provider_payment_id <> p_provider_payment_id then
      raise exception 'Conflicting Cashfree payment identifier for captured order';
    end if;
    if v_order.status='PAYMENT_PENDING' then
      update public.orders set status='CONFIRMED', updated_at=now() where id=p_order_id;
    end if;
    return p_order_id;
  end if;

  select * into v_existing
  from public.payment_transactions
  where order_id=p_order_id and status='CAPTURED' and id<>v_tx.id
  limit 1;
  if found then raise exception 'Order already has a captured payment'; end if;

  update public.payment_transactions
    set provider_payment_id=p_provider_payment_id,
        amount=p_amount,
        currency='INR',
        status='CAPTURED',
        failure_reason=null,
        updated_at=now()
  where id=v_tx.id;

  update public.orders
    set status='CONFIRMED', updated_at=now()
  where id=p_order_id and status='PAYMENT_PENDING';

  if v_order.status not in ('PAYMENT_PENDING','CONFIRMED') then
    raise exception 'Order is not in a payable state';
  end if;

  return p_order_id;
end;
$$;

revoke execute on function public.mark_cashfree_payment_captured(uuid,text,text,numeric,text) from public, anon, authenticated;
grant execute on function public.mark_cashfree_payment_captured(uuid,text,text,numeric,text) to service_role;
