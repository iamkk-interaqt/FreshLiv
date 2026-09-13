create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null,
  provider_order_id text,
  provider_payment_id text,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'INR',
  status text not null check (status in ('CREATED','AUTHORIZED','CAPTURED','FAILED','REFUNDED','PARTIALLY_REFUNDED')),
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payment_transactions_provider_order_uidx
  on public.payment_transactions(provider, provider_order_id)
  where provider_order_id is not null;

create unique index if not exists payment_transactions_provider_payment_uidx
  on public.payment_transactions(provider, provider_payment_id)
  where provider_payment_id is not null;

create index if not exists payment_transactions_order_idx on public.payment_transactions(order_id);

alter table public.payment_transactions enable row level security;

create policy "customers can view own payment transactions"
  on public.payment_transactions for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = payment_transactions.order_id
        and o.customer_id = auth.uid()
    )
  );

create or replace function public.mark_payment_captured(
  p_provider text,
  p_provider_order_id text,
  p_provider_payment_id text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment_id uuid;
  v_order_id uuid;
begin
  select id, order_id into v_payment_id, v_order_id
  from public.payment_transactions
  where provider = p_provider and provider_order_id = p_provider_order_id
  for update;

  if v_payment_id is null then
    raise exception 'Payment transaction not found';
  end if;

  update public.payment_transactions
  set provider_payment_id = p_provider_payment_id,
      status = 'CAPTURED',
      updated_at = now()
  where id = v_payment_id;

  update public.orders
  set status = 'CONFIRMED', updated_at = now()
  where id = v_order_id and status = 'PAYMENT_PENDING';

  return v_order_id;
end;
$$;

grant execute on function public.mark_payment_captured(text,text,text) to service_role;
revoke all on function public.mark_payment_captured(text,text,text) from public, authenticated, anon;
