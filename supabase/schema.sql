-- InjetBox: cole este SQL no Supabase (SQL Editor -> New query -> Run)
-- Authentication -> Providers -> Email
-- Para testes rápidos, desative "Confirm email".
-- Em produção, você pode ligar a confirmação de e-mail de novo.
--
-- Modelo B2B:
-- - cada usuário pertence a um tenant (estabelecimento)
-- - produtos e movimentos ficam isolados por tenant via RLS
-- - personalização visual fica em tenant_settings

create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Estabelecimento',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  is_admin boolean not null default false,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  company_name text,
  logo_url text,
  primary_color text,
  primary_soft_color text,
  background_color text,
  background_alt_color text,
  surface_color text,
  text_color text,
  muted_color text,
  stock_ok_color text,
  stock_ok_text_color text,
  stock_low_color text,
  stock_low_text_color text,
  stock_zero_color text,
  stock_zero_text_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  code text,
  brand text not null,
  tipo text not null default 'Geral',
  category text not null default '',
  quantity numeric not null default 0,
  min_quantity numeric not null default 0,
  unit text not null default 'un',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  type text not null check (type in ('entrada', 'saida', 'ajuste')),
  quantity numeric not null,
  previous_quantity numeric not null,
  new_quantity numeric not null,
  user_name text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists profiles_tenant_idx on public.profiles (tenant_id);
create index if not exists products_tenant_idx on public.products (tenant_id);
create index if not exists products_tenant_code_idx on public.products (tenant_id, code);
create index if not exists products_tenant_brand_idx on public.products (tenant_id, brand);
create index if not exists movements_tenant_created_idx on public.movements (tenant_id, created_at desc);
create index if not exists movements_created_at_idx on public.movements (created_at desc);

create or replace function public.current_tenant_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid() limit 1
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (
      select p.is_platform_admin
      from public.profiles p
      where p.id = auth.uid()
      limit 1
    ),
    false
  )
$$;

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_settings enable row level security;
alter table public.products enable row level security;
alter table public.movements enable row level security;

drop policy if exists "tenants_own_select" on public.tenants;
create policy "tenants_own_select" on public.tenants
  for select to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.tenant_id = tenants.id
    )
  );

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
-- Sem policy de update direto em profiles para evitar elevação de privilégio de admin.

drop policy if exists "profiles_update_platform_admin" on public.profiles;
create policy "profiles_update_platform_admin" on public.profiles
  for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "tenant_settings_own_select" on public.tenant_settings;
create policy "tenant_settings_own_select" on public.tenant_settings
  for select to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_platform_admin());

drop policy if exists "tenant_settings_own_update" on public.tenant_settings;
create policy "tenant_settings_own_update" on public.tenant_settings
  for update to authenticated
<<<<<<< HEAD
  using (tenant_id = public.current_tenant_id() or public.is_platform_admin())
  with check (tenant_id = public.current_tenant_id() or public.is_platform_admin());
=======
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
>>>>>>> develop

drop policy if exists "tenant_settings_own_insert" on public.tenant_settings;
create policy "tenant_settings_own_insert" on public.tenant_settings
  for insert to authenticated
<<<<<<< HEAD
  with check (tenant_id = public.current_tenant_id() or public.is_platform_admin());
=======
  with check (public.is_platform_admin());
>>>>>>> develop

drop policy if exists "products_tenant_all" on public.products;
create policy "products_tenant_all" on public.products
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_platform_admin())
  with check (tenant_id = public.current_tenant_id() or public.is_platform_admin());

drop policy if exists "movements_tenant_select" on public.movements;
create policy "movements_tenant_select" on public.movements
  for select to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_platform_admin());

drop policy if exists "movements_tenant_insert" on public.movements;
create policy "movements_tenant_insert" on public.movements
  for insert to authenticated
  with check (tenant_id = public.current_tenant_id() or public.is_platform_admin());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid := gen_random_uuid();
  v_name text := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
begin
  insert into public.tenants (id, name)
  values (v_tenant_id, v_name);

  insert into public.profiles (id, tenant_id, name, is_admin)
  values (new.id, v_tenant_id, v_name, true);

  insert into public.tenant_settings (tenant_id, company_name)
  values (v_tenant_id, v_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_product_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;
  new.user_id := auth.uid();
  new.tenant_id := public.current_tenant_id();
  if new.tenant_id is null then
    raise exception 'Tenant não encontrado';
  end if;
  return new;
end;
$$;

drop trigger if exists products_set_owner on public.products;
create trigger products_set_owner
  before insert on public.products
  for each row execute procedure public.set_product_owner();

create or replace function public.register_movement(
  p_product_id uuid,
  p_type text,
  p_quantity numeric,
  p_notes text default null
)
returns public.movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev numeric;
  v_new numeric;
  v_user_name text;
  v_tenant_id uuid;
  v_row public.movements;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  v_tenant_id := public.current_tenant_id();
  if v_tenant_id is null then
    raise exception 'Tenant não encontrado';
  end if;

  if p_quantity <= 0 then
    raise exception 'Quantidade deve ser maior que zero';
  end if;

  if p_type not in ('entrada', 'saida', 'ajuste') then
    raise exception 'Tipo inválido';
  end if;

  select quantity into v_prev
  from public.products
  where id = p_product_id
    and tenant_id = v_tenant_id
  for update;

  if not found then
    raise exception 'Produto não encontrado';
  end if;

  if p_type = 'entrada' then
    v_new := v_prev + p_quantity;
  elsif p_type = 'saida' then
    v_new := v_prev - p_quantity;
    if v_new < 0 then
      raise exception 'Estoque insuficiente';
    end if;
  else
    v_new := p_quantity;
  end if;

  update public.products
  set quantity = v_new, updated_at = now()
  where id = p_product_id
    and tenant_id = v_tenant_id;

  select name into v_user_name from public.profiles where id = auth.uid();
  v_user_name := coalesce(v_user_name, 'Usuário');

  insert into public.movements (
    tenant_id, user_id, product_id, type, quantity, previous_quantity, new_quantity, user_name, notes
  ) values (
    v_tenant_id,
    auth.uid(),
    p_product_id,
    p_type,
    case when p_type = 'ajuste' then v_new - v_prev else p_quantity end,
    v_prev,
    v_new,
    v_user_name,
    p_notes
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.register_movement(uuid, text, numeric, text) to authenticated;

alter table public.products replica identity full;
alter table public.movements replica identity full;

do $$
begin
  execute 'alter publication supabase_realtime add table public.products';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.movements';
exception
  when duplicate_object then null;
end $$;
