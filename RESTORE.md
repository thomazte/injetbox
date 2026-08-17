# Restore do InjetBox

O Git guarda o **app**. O Supabase guarda o **estoque**. O `.env` não vai para o Git.

## 1. Restaurar o código

```powershell
git clone https://github.com/thomazte/injetbox.git
cd injetbox
npm install
copy .env.example .env
```

Abra o `.env` e cole:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (chave **publishable**, nunca a secret)

```powershell
npm run dev
```

O estoque da conta continua no Supabase. Não precisa reimportar a planilha.

## 2. Restaurar o banco (só se o projeto Supabase for apagado)

1. Crie um projeto novo no Supabase.
2. SQL Editor → cole `supabase/schema.sql` → Run.
3. Authentication → Email → desligue Confirm email.
4. Project Settings → API Keys → copie URL e publishable para o `.env`.
5. Contas voltam a poder ser criadas. **Produtos só voltam com backup dos dados.**

## 3. Backup dos dados (faça de vez em quando)

No Supabase: Table Editor → `products` → Export CSV.  
Repita para `movements` e `profiles`.

Guarde os CSV fora do Git (Drive, pasta da empresa).

## 4. Conferir o restore no GitHub

Actions → **Restore check** → Run workflow.
