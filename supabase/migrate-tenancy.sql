-- Use só se o schema antigo (estoque compartilhado) já foi aplicado.
-- Depois deste arquivo, rode schema.sql de novo para políticas, triggers e funções.

alter table public.products
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.movements
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- Se ainda existirem linhas sem dono, atribua ao primeiro usuário:
update public.products p
set user_id = u.id
from (select id from auth.users order by created_at asc limit 1) u
where p.user_id is null;

update public.movements m
set user_id = coalesce(
  m.user_id,
  (select p.user_id from public.products p where p.id = m.product_id),
  (select id from auth.users order by created_at asc limit 1)
)
where m.user_id is null;

create index if not exists products_user_id_idx on public.products (user_id);
create index if not exists movements_user_id_idx on public.movements (user_id, created_at desc);

drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "products_all" on public.products;
drop policy if exists "movements_select" on public.movements;
drop policy if exists "movements_insert" on public.movements;
