-- FreshLiv: only milk products require a milk source.
-- Chicken, mutton, fish, eggs and other future categories must not inherit dairy-only validation.
create or replace function public.enforce_product_milk_source()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if upper(coalesce(new.product_category, '')) in ('MILK','PREMIUM_MILK')
     or (nullif(trim(new.product_category), '') is null and nullif(trim(new.product_type), '') is not null) then
    if nullif(trim(new.product_type), '') is null then
      raise exception 'Milk source is required for milk products: choose COW, BUFFALO, or MIXED';
    end if;
    if upper(new.product_type) not in ('COW','BUFFALO','MIXED') then
      raise exception 'Invalid milk source. Choose COW, BUFFALO, or MIXED';
    end if;
    new.product_type := upper(new.product_type);
  else
    new.product_type := null;
  end if;
  return new;
end;
$function$;
