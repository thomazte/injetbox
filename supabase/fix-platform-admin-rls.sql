-- Hotfix para RLS de admin da plataforma e save do tema.
-- Rode após atualizar para schema com is_platform_admin.

alter table public.tenant_settings add column if not exists background_alt_color text;
alter table public.tenant_settings add column if not exists surface_color text;
alter table public.tenant_settings add column if not exists stock_ok_color text;
alter table public.tenant_settings add column if not exists stock_ok_text_color text;
alter table public.tenant_settings add column if not exists stock_low_color text;
alter table public.tenant_settings add column if not exists stock_low_text_color text;
alter table public.tenant_settings add column if not exists stock_zero_color text;
alter table public.tenant_settings add column if not exists stock_zero_text_color text;

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

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "tenant_settings_own_insert" on public.tenant_settings;
create policy "tenant_settings_own_insert" on public.tenant_settings
  for insert to authenticated
  with check (public.is_platform_admin());

drop policy if exists "tenant_settings_own_update" on public.tenant_settings;
create policy "tenant_settings_own_update" on public.tenant_settings
  for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
