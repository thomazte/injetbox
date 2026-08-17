-- InjetBox: cole este SQL no Supabase (SQL Editor → New query → Run)
-- Authentication → Providers → Email
-- Para testes rápidos, desative "Confirm email".
-- Em produção, você pode ligar a confirmação de e-mail de novo.
--
-- Cada conta (auth.users) vê só o próprio estoque via RLS.
-- Não é um banco físico por cliente: é o mesmo Postgres, com isolamento por user_id.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
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

create index if not exists products_user_id_idx on public.products (user_id);
create index if not exists products_user_code_idx on public.products (user_id, code);
create index if not exists products_brand_idx on public.products (brand);
create index if not exists movements_user_id_idx on public.movements (user_id, created_at desc);
create index if not exists movements_created_at_idx on public.movements (created_at desc);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.movements enable row level security;

drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid());

drop policy if exists "products_all" on public.products;
drop policy if exists "products_own" on public.products;
create policy "products_own" on public.products
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "movements_select" on public.movements;
drop policy if exists "movements_insert" on public.movements;
drop policy if exists "movements_own_select" on public.movements;
drop policy if exists "movements_own_insert" on public.movements;
create policy "movements_own_select" on public.movements
  for select to authenticated using (user_id = auth.uid());
create policy "movements_own_insert" on public.movements
  for insert to authenticated with check (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
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
  v_row public.movements;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
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
    and user_id = auth.uid()
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
    and user_id = auth.uid();

  select name into v_user_name from public.profiles where id = auth.uid();
  v_user_name := coalesce(v_user_name, 'Usuário');

  insert into public.movements (
    user_id, product_id, type, quantity, previous_quantity, new_quantity, user_name, notes
  ) values (
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
