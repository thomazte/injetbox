-- Restringe alteração de tenant_settings (visual do catálogo)
-- apenas para contas com is_platform_admin = true.
-- Execute no SQL Editor do Supabase.

drop policy if exists "tenant_settings_own_update" on public.tenant_settings;
create policy "tenant_settings_own_update" on public.tenant_settings
  for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "tenant_settings_own_insert" on public.tenant_settings;
create policy "tenant_settings_own_insert" on public.tenant_settings
  for insert to authenticated
  with check (public.is_platform_admin());
