-- Gwalawala product discovery taxonomy and Dairywala profile fields
alter table public.dairywala_profiles
  add column if not exists families_served integer,
  add column if not exists years_in_business integer,
  add column if not exists profile_avatar text default '👨';

alter table public.products
  add column if not exists product_category text,
  add column if not exists product_variant text,
  add column if not exists usage_types text[] default '{}',
  add column if not exists milk_breed text,
  add column if not exists bulk_order_enabled boolean not null default false;

alter table public.dairywala_profiles drop constraint if exists dairywala_profiles_families_served_check;
alter table public.dairywala_profiles add constraint dairywala_profiles_families_served_check check (families_served is null or families_served >= 0);
alter table public.dairywala_profiles drop constraint if exists dairywala_profiles_years_in_business_check;
alter table public.dairywala_profiles add constraint dairywala_profiles_years_in_business_check check (years_in_business is null or years_in_business >= 0);

alter table public.products drop constraint if exists products_category_check;
alter table public.products add constraint products_category_check check (product_category is null or upper(product_category) in ('MILK','PREMIUM_MILK','PANEER','CURD','BUTTER','GHEE','KHOYA_MAWA'));

alter table public.products drop constraint if exists products_variant_check;
alter table public.products add constraint products_variant_check check (product_variant is null or upper(product_variant) in ('ORIGINAL','MIXED'));

alter table public.products drop constraint if exists products_usage_types_check;
alter table public.products add constraint products_usage_types_check check (
  usage_types is null or usage_types <@ array['EVERYDAY_DRINKING','TEA','COFFEE','COOKING','KHEER_SWEETS','PANEER_CURD_MAKING','GYM_DIET','HOME_USE','SHOP_USE']::text[]
);

alter table public.products drop constraint if exists products_premium_breed_check;
alter table public.products add constraint products_premium_breed_check check (milk_breed is null or length(btrim(milk_breed)) between 2 and 80);

create index if not exists products_category_variant_idx on public.products(product_category, product_variant, product_type, status);
create index if not exists products_milk_breed_idx on public.products(milk_breed) where milk_breed is not null;
