-- FreshLiv marketplace expansion: preserve the existing marketplace engine while supporting
-- Dairy + Chicken + Mutton + Fish + Eggs.
-- This migration is already represented in the connected Supabase project; the file is kept
-- in Git so the database schema and repository migration history remain reproducible.

alter table public.products
  add column if not exists product_category text,
  add column if not exists product_variant text,
  add column if not exists usage_types text[] default '{}',
  add column if not exists milk_breed text,
  add column if not exists bulk_order_enabled boolean not null default false;

-- Product taxonomy is intentionally open-ended at the database layer so new fresh-food
-- categories can be added without another schema migration. Application/admin validation
-- controls the supported category set.
alter table public.products drop constraint if exists products_product_category_check;
alter table public.products add constraint products_product_category_check
  check (product_category is null or (length(btrim(product_category)) between 2 and 60));

alter table public.products drop constraint if exists products_product_variant_check;
alter table public.products add constraint products_product_variant_check
  check (product_variant is null or (length(btrim(product_variant)) between 2 and 80));

alter table public.products drop constraint if exists products_milk_breed_check;
alter table public.products add constraint products_milk_breed_check
  check (milk_breed is null or (length(btrim(milk_breed)) between 2 and 80));

create index if not exists products_category_variant_status_idx
  on public.products(product_category, product_variant, status);

create index if not exists products_seller_category_status_idx
  on public.products(dairywala_id, product_category, status);
