create or replace function public.run_settlement_reconciliation()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  update public.marketplace_order_splits s
  set provider_status = 'ELIGIBLE', updated_at = now()
  from public.orders o
  where s.order_id = o.id
    and o.status = 'COMPLETED'
    and s.provider_status in ('PENDING','CREATED','RECONCILIATION_PENDING')
    and exists (
      select 1 from public.payment_transactions p
      where p.order_id = o.id and p.status = 'CAPTURED'
    );
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.run_settlement_reconciliation() from public;
grant execute on function public.run_settlement_reconciliation() to service_role;

create index if not exists idx_marketplace_order_splits_dairywala_status_created
on public.marketplace_order_splits (dairywala_id, provider_status, created_at desc);

create index if not exists idx_marketplace_settlement_events_dairywala_created
on public.marketplace_settlement_events (dairywala_id, created_at desc);

create index if not exists idx_payment_transactions_order_status
on public.payment_transactions (order_id, status, updated_at desc);
