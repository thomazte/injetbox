# InjetBox

Documentação do projeto. O resumo rápido para subir o ambiente continua no [`README.md`](../README.md) da raiz.

InjetBox é um controle de estoque para oficina: cadastro de peças, entrada e saída, alerta de estoque baixo e histórico. Roda no navegador, no Windows (Electron) e no Android (Capacitor). O backend é o Supabase (auth + Postgres). Cada conta vê só o próprio estoque.

Versão atual: **1.0.7**. Autor: **ZamohtExe**. Licença proprietária — veja [`LICENSE`](../LICENSE).

- [O que o app faz](#o-que-o-app-faz)
- [Telas](#telas)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Desenvolvimento](#desenvolvimento)
- [Banco de dados](#banco-de-dados)
- [Plataformas](#plataformas)
- [Release](#release)
- [Restore](#restore)

## O que o app faz

- Login e cadastro por e-mail (Supabase). Sem nuvem configurada, cai para contas locais no aparelho.
- Catálogo de produtos: código, marca, tipo, categoria, quantidade, mínimo, unidade e observação.
- Movimentações: entrada, saída e ajuste, com saldo anterior/novo e quem alterou.
- Alertas quando o item está zerado ou abaixo do mínimo.
- Importação de planilha Excel, com mapeamento de colunas.
- Isolamento por usuário no banco (RLS). Não há um banco físico por cliente.

## Telas

| Tela | Função |
| --- | --- |
| Login | Entrar ou criar conta |
| Estoque | Lista, busca, filtros por tipo, KPIs, novo item e planilha |
| Alertas | Itens zerados ou abaixo do mínimo |
| Histórico | Entradas, saídas e ajustes |

No celular a navegação fica na barra inferior. No desktop, no menu lateral.

## Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS 4
- Supabase (`@supabase/supabase-js`)
- Electron 43 (Windows portátil)
- Capacitor 8 (Android)
- GitHub Actions (lint/build em todo push na `main`; APK + exe nas tags `v*`)

## Arquitetura

O app é um SPA. A mesma UI serve web, Electron e WebView do Android. Auth e estoque ficam em contextos React; a persistência é Supabase quando configurado, ou `localStorage` no aparelho.

### Pastas

```
src/
  App.tsx                 # gate de sessão + abas
  main.tsx
  types.ts
  components/             # ProductCard, ProductForm, MovementSheet, campos
  context/
    AuthContext.tsx       # sessão, login, cadastro, nome do perfil
    InventoryContext.tsx  # produtos, movimentos, CRUD, importação
  lib/
    supabase.ts           # cliente (URL/chave de env ou supabasePublic.ts)
    supabasePublic.ts     # config pública embutida no app
    localAuth.ts          # contas e estoque locais (fallback)
    product.ts            # normalização de produto/movimento
    excel.ts              # leitura de planilha
    recoverLocalStock.ts  # recupera estoque legado no aparelho
    brand.ts              # nome e tagline
  screens/
electron/                 # janela Windows
android/                  # projeto Capacitor
supabase/                 # schema e migração
scripts/                  # versão de release, APK, cópia do .exe
```

### Fluxo da UI

`App` envolve tudo em `AuthProvider`. Sem usuário, mostra `LoginScreen`. Com usuário, `InventoryProvider` carrega o estoque e o `Shell` troca entre Estoque, Alertas e Histórico.

`SetupScreen` existe no código, mas não entra no fluxo atual: o app já usa a config pública do Supabase (ou o `.env` no desenvolvimento).

### Dados

Tipos em `src/types.ts`.

**Produto:** `id`, `code`, `brand`, `tipo`, `category`, `quantity`, `min_quantity`, `unit`, `notes`, timestamps.

**Movimento:** `entrada` | `saida` | `ajuste`, quantidades anterior/nova, `user_name`, `notes`.

Status de estoque (`ok` / `baixo` / `zerado`) é derivado da quantidade e do mínimo.

### Persistência

Com Supabase configurado (`VITE_SUPABASE_*` ou valores em `supabasePublic.ts`):

- Sessão no Auth do Supabase, com refresh automático.
- Produtos e movimentos filtrados pelo `user_id` (RLS).
- Entrada, saída e ajuste passam pela RPC `register_movement`, que atualiza o saldo e grava o histórico na mesma transação.
- Realtime em `products` e `movements`.

Sem Supabase:

- Contas em `injetbox.accounts`, sessão em `injetbox.session`.
- Estoque em `injetbox.products.<userId>` e `injetbox.movements.<userId>`.
- Há recuperação de chaves antigas `carcacas.*` (nome anterior do app).

O modo local é por aparelho. Não sincroniza entre web, Windows e celular.

### Identidade

- Nome do produto: `InjetBox` (`src/lib/brand.ts`)
- App ID: `br.injetbox.app` (Electron e Capacitor)
- Pacote Android (Java): `br.carcacas.estoque` — legado do nome anterior; o `applicationId` do app é o do Capacitor.

## Desenvolvimento

Requisitos: Node.js 22, npm, Git. No Windows, PowerShell serve para o fluxo web/desktop. APK pede Android SDK (Android Studio).

### Subir o app

Na raiz do repositório:

```powershell
npm install
copy .env.example .env
npm run dev
```

Abre http://localhost:5173/. Sem `.env`, o cliente usa a URL e a chave publishable em `src/lib/supabasePublic.ts`.

O `.env` só sobrescreve essa config no desenvolvimento. Nunca coloque a chave **secret** do Supabase no app — só a publishable / anon.

| Variável | Uso |
| --- | --- |
| `VITE_SUPABASE_URL` | URL do projeto |
| `VITE_SUPABASE_ANON_KEY` | Chave publishable |

Arquivos `.env` entram no `.gitignore`. `.env.example` e `.env.production` são as exceções versionadas.

### Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | Vite, hot reload |
| `npm run build` | `tsc -b` + build de produção |
| `npm run lint` | oxlint |
| `npm run preview` | serve o `dist/` |
| `npm run desktop` | Vite + Electron apontando para localhost |
| `npm run desktop:build` | build com `base ./`, gera o `.exe` portátil, copia para a Área de Trabalho |
| `npm run android:sync` | build web + `cap sync android` |
| `npm run android:open` | abre o projeto no Android Studio |
| `npm run android:apk` | sync + `assembleDebug`; copia o APK para a Área de Trabalho fora da CI |

### Qualidade

CI na `main` (e em PR para `main`) roda `npm ci`, lint e build. Antes de push:

```powershell
npm run lint
npm run build
```

- UI e mensagens em português.
- Não commitar `.env` com segredos, `node_modules`, `dist/`, `release/` nem APK.
- Commits e tags de versão seguem o que já está no histórico (`v1.0.6`, mensagens em português).

## Banco de dados

O InjetBox usa um único projeto Supabase. O isolamento é por linha (`user_id` + RLS), não por banco separado.

### Aplicar o schema

No dashboard: **SQL Editor → New query**. Cole e rode [`supabase/schema.sql`](../supabase/schema.sql).

Em **Authentication → Providers → Email**:

- Para teste, desative **Confirm email**.
- Em produção, pode ligar de novo.

O arquivo cria extensão `pgcrypto`, tabelas `profiles`, `products` e `movements`, políticas RLS, trigger `on_auth_user_created` (cria perfil), trigger `products_set_owner` (preenche `user_id` no insert), função `register_movement` e realtime em `products` e `movements`.

### Tabelas

**profiles** — `id` = `auth.users.id`, `name`.

**products** — peça do usuário: código, marca, tipo (padrão `Geral`), categoria, quantidade, mínimo, unidade (`un`), notas.

**movements** — histórico. `type` só aceita `entrada`, `saida`, `ajuste`.

### Regras

- Usuário autenticado lê e altera só o próprio perfil.
- Produtos: CRUD só quando `user_id = auth.uid()`.
- Movimentos: select e insert só do próprio usuário. Update/delete de movimento não entram nas policies.

`register_movement` valida autenticação, quantidade > 0, tipo, existência do produto e estoque suficiente na saída. Recalcula o saldo, atualiza o produto e insere o movimento com o nome do perfil.

### Migração de tenancy

Se o schema antigo (estoque compartilhado, sem `user_id`) já estava aplicado, rode primeiro [`supabase/migrate-tenancy.sql`](../supabase/migrate-tenancy.sql) e depois o `schema.sql` de novo (policies, triggers e funções).

Linhas sem dono são atribuídas ao primeiro usuário em `auth.users`.

## Plataformas

A UI é a mesma. Cada alvo só empacota o `dist/` de jeito diferente.

| Alvo | Como sobe | Saída |
| --- | --- | --- |
| Web | `npm run dev` | http://localhost:5173 |
| Windows | `npm run desktop` / `npm run desktop:build` | `.exe` portátil em `release/` (e na Área de Trabalho, fora da CI) |
| Android | `npm run android:apk` | APK debug `InjetBox.apk` |

### Web

Vite em `vite.config.ts`. PWA básica em `public/` (`manifest.webmanifest`, `sw.js`). Ícone: `public/icon-512.png`.

### Windows (Electron)

- Entrada: `electron/main.mjs`
- Preload: `electron/preload.mjs` (context isolation, sem Node na página)
- Dev: janela em http://localhost:5173
- Empacotado: carrega `dist/index.html`
- Título da janela: `InjetBox  © ZamohtExe`
- `electron-builder`: appId `br.injetbox.app`, alvo portátil x64, artefato `InjetBox-<versão>.exe`

Há um ajuste de CORS na sessão do Electron para chamadas a `*.supabase.co`.

Fora da CI, `scripts/copy-desktop-build.mjs` copia o `.exe` para `%USERPROFILE%\Desktop\InjetBox\`.

### Android (Capacitor)

- `capacitor.config.ts`: `appId` `br.injetbox.app`, `webDir` `dist`, scheme `https`, navegação permitida a `*.supabase.co`
- Splash e status bar escuros (`#0a0a0a`)
- `npm run android:apk` gera APK **debug** (`assembleDebug`)
- Fora da CI, o APK vai para `%USERPROFILE%\Desktop\InjetBox\InjetBox.apk`

O código Java ainda usa o pacote `br.carcacas.estoque` (nome antigo). Não misturar com o `applicationId` do app.

Internet é obrigatória no modo nuvem (`AndroidManifest` pede `INTERNET`).

## Release

A versão canônica no repo é a do `package.json` (hoje `1.0.7`). O instalador Windows usa essa versão no nome do arquivo. O Android usa `versionName` em `android/app/build.gradle`.

### CI do dia a dia

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml): push ou PR para `main` → Node 22, `npm ci`, lint, build.

### Release com tag

[`.github/workflows/release.yml`](../.github/workflows/release.yml) dispara em tags `v*`.

1. Job **android** (Ubuntu + Java 21): ajusta versão, build, `cap sync`, APK debug.
2. Job **desktop** (Windows): ajusta versão, `npm run desktop:build`.
3. Job **publish**: anexa `InjetBox.apk` e o `.exe` à GitHub Release da tag.

`scripts/set-release-version.mjs` lê `GITHUB_REF_NAME` (ex.: `v1.0.6`), grava em `package.json` e no `versionName` do Gradle. Tag que não for `vX.Y.Z` deixa a versão como está.

### Publicar uma versão

```powershell
git tag v1.0.7
git push origin v1.0.7
```

Espere os dois jobs de build e a Release no GitHub. Confira os artefatos antes de distribuir.

Build local, sem tag:

```powershell
npm run desktop:build
npm run android:apk
```

## Restore

Como reerguer o InjetBox num computador novo a partir deste repositório.

### 1. Código

```powershell
git clone <url-do-repositorio> injetbox
cd injetbox
```

Node.js 22 e npm na PATH.

### 2. Dependências e env

```powershell
npm install
copy .env.example .env
```

Edite `.env` só se for apontar para outro projeto Supabase. Caso contrário, o app já usa `src/lib/supabasePublic.ts`.

### 3. Banco (se o projeto Supabase estiver vazio)

1. Abra o SQL Editor do Supabase.
2. Rode `supabase/schema.sql`.
3. Em Authentication → Email, defina se a confirmação de e-mail está ligada.
4. Se o schema antigo compartilhado ainda existir, rode `supabase/migrate-tenancy.sql` e depois o `schema.sql` de novo.

### 4. Conferir

```powershell
npm run lint
npm run build
npm run dev
```

Login em http://localhost:5173/. Estoque, um produto de teste, entrada/saída e a aba de histórico.

### 5. Desktop e Android (opcional)

```powershell
npm run desktop
npm run android:apk
```

APK pede Android Studio / SDK (`ANDROID_HOME` ou o SDK padrão em `%LOCALAPPDATA%\Android\Sdk`).

### O que não vem no Git

`node_modules`, `dist/`, `release/`, `.env` local, builds Gradle e APK. Tudo isso se regenera com os comandos acima.

Dados de estoque estão no Supabase (modo nuvem) ou só no `localStorage` daquele aparelho (modo local). Restore do código não recupera estoque local de outro PC ou celular.
