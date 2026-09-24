# InjetBox - Documentação detalhada

Esta pasta concentra a documentação completa do projeto. O resumo rápido de uso fica no [`README.md`](../README.md).

## Índice

- [Visão geral](#visao-geral)
- [Arquitetura e stack](#arquitetura-e-stack)
- [Modos do produto](#modos-do-produto)
- [Banco de dados (Supabase)](#banco-de-dados-supabase)
- [Desenvolvimento local](#desenvolvimento-local)
- [Build, release e distribuição](#build-release-e-distribuicao)
- [Documentos desta pasta](#documentos-desta-pasta)
- [Licenças](#licencas)

## Visão geral

O InjetBox é um sistema de controle de estoque com:

- cadastro e consulta de peças;
- entrada e saída de estoque com histórico;
- alertas de baixo estoque;
- visual por empresa (nome, logo e cores);
- operação em 2 modos de produto no mesmo código.

## Arquitetura e stack

- Frontend: React 19 + TypeScript + Vite 8 + Tailwind CSS 4
- Backend: Supabase (Auth + Postgres + RLS + Realtime)
- Desktop: Electron
- Android: Capacitor

Estrutura principal:

```text
src/        app React (telas, componentes, contextos, libs)
supabase/   schema SQL e migrações
electron/   empacotamento desktop
android/    projeto Android (Capacitor)
docs/       documentação detalhada
```

## Modos do produto

Controlados por `VITE_APP_MODE`:

- `operacao`: gestão completa;
- `catalogo`: consulta (sem operações de estoque).

Exemplos (PowerShell):

```powershell
$env:VITE_APP_MODE="operacao"; npm run dev
$env:VITE_APP_MODE="catalogo"; npm run dev
```

## Banco de dados (Supabase)

Arquivos principais:

- Schema principal: [`supabase/schema.sql`](../supabase/schema.sql)
- Migração de tenancy: [`supabase/migrate-b2b-tenants.sql`](../supabase/migrate-b2b-tenants.sql)
- Ajustes RLS admin: [`supabase/fix-platform-admin-rls.sql`](../supabase/fix-platform-admin-rls.sql)

Conceitos implementados:

- multi-tenant por `tenant_id`;
- isolamento por RLS;
- perfil admin e platform admin;
- `tenant_settings` para branding por empresa.

## Desenvolvimento local

Passo a passo:

```powershell
npm install
copy .env.example .env
$env:VITE_APP_MODE="operacao"; npm run dev
```

Scripts úteis:

- `npm run build`
- `npm run lint`
- `npm run desktop`
- `npm run desktop:build`
- `npm run desktop:build:linux`
- `npm run desktop:build:linux:all`
- `npm run android:apk`
- `npm run catalogo:cliente -- --name "Cliente" --logo "https://..."` (gera catálogo web por cliente)

Comandos essenciais:

- Desenvolvimento web: `npm run dev`
- Build web: `npm run build`
- Desktop Windows: `npm run desktop:build`
- Desktop Linux: `npm run desktop:build:linux`
- Desktop Linux (operação + catálogo): `npm run desktop:build:linux:all`
- APK Android: `npm run android:apk`

Catálogo por cliente:

```bash
npm run catalogo:cliente -- --name "Nome do Cliente" --logo "https://exemplo.com/logo.png"
```

Para publicar direto no Worker:

```bash
npm run catalogo:cliente -- --name "Nome do Cliente" --logo "https://exemplo.com/logo.png" --deploy
```

## Build, release e distribuição

- CI padrão: `lint + build` a cada push/PR na `main`.
- Release: workflow de matriz para `operacao` e `catalogo` (Android + Desktop).
- Versionamento por tag: `vX.Y.Z`.

Regras atuais de acesso:

- No modo catálogo, ações de cadastro/movimentação (`Novo` e `Entrada/Saída`) ficam liberadas apenas para `zamoht.exe@gmail.com`.
- Personalização de visual do catálogo também fica restrita ao mesmo login.

## Documentos desta pasta

- Guia de bootstrap comercial: [`B2B-BOOTSTRAP.md`](./B2B-BOOTSTRAP.md)
- Licença MIT (cópia): [`LICENSE-MIT.md`](./LICENSE-MIT.md)

## Licenças

- Arquivo de licença na raiz: [`../LICENSE`](../LICENSE)
- Cópia da licença MIT em `docs`: [`LICENSE-MIT.md`](./LICENSE-MIT.md)
