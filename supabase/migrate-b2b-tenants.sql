-- Migração para modelo B2B (tenants + tenant_settings)
-- Rode este arquivo apenas em banco existente.
-- Depois rode schema.sql novamente para recriar políticas/triggers/funções.

create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Estabelecimento',
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;

create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  company_name text,
  logo_url text,
  primary_color text,
  primary_soft_color text,
  background_color text,
  text_color text,
  muted_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products
  add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;

alter table public.movements
  add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;

do $$
declare
  r record;
  v_tenant uuid;
begin
  for r in
    select id, name
    from public.profiles
    order by created_at asc
  loop
    if r.tenant_id is null then
      v_tenant := gen_random_uuid();
      insert into public.tenants (id, name)
      values (v_tenant, coalesce(nullif(trim(r.name), ''), 'Estabelecimento'))
      on conflict (id) do nothing;

      update public.profiles
      set tenant_id = v_tenant
      where id = r.id;

      insert into public.tenant_settings (tenant_id, company_name)
      values (v_tenant, coalesce(nullif(trim(r.name), ''), 'Estabelecimento'))
      on conflict (tenant_id) do nothing;
    end if;
  end loop;
end $$;

update public.products p
set tenant_id = pr.tenant_id
from public.profiles pr
where p.tenant_id is null
  and p.user_id = pr.id;

update public.movements m
set tenant_id = coalesce(
  m.tenant_id,
  p.tenant_id,
  pr.tenant_id
)
from public.products p
left join public.profiles pr on pr.id = m.user_id
where m.product_id = p.id
  and m.tenant_id is null;

-- fallback final: primeiro tenant existente
update public.products
set tenant_id = (select id from public.tenants order by created_at asc limit 1)
where tenant_id is null;

update public.movements
set tenant_id = (select id from public.tenants order by created_at asc limit 1)
where tenant_id is null;

alter table public.profiles alter column tenant_id set not null;
alter table public.products alter column tenant_id set not null;
alter table public.movements alter column tenant_id set not null;
