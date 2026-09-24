# InjetBox

Sistema de controle de estoque com 2 modos (`operacao`, `catalogo`) e tema por empresa.

## Início rápido

```powershell
npm install
copy .env.example .env
$env:VITE_APP_MODE="operacao"; npm run dev
```

Abra: `http://localhost:5173/`

## Scripts principais

- Web (dev): `npm run dev`
- Build: `npm run build`
- Desktop (Windows): `npm run desktop` / `npm run desktop:build`
- Desktop (Linux): `npm run desktop:build:linux` (modo atual) / `npm run desktop:build:linux:all` (operação e catálogo)
- Android (APK): `npm run android:apk`
- Catalogo por cliente (web): `npm run catalogo:cliente -- --name "Cliente" --logo "https://..."` (`--deploy` para publicar no Worker)

## Modos de execução

- Operação: `$env:VITE_APP_MODE="operacao"; npm run dev`
- Catálogo: `$env:VITE_APP_MODE="catalogo"; npm run dev`

## Regras de acesso

- No catálogo, as ações `Novo` e `Entrada/Saída` ficam disponíveis somente para o login `zamoht.exe@gmail.com`.
- A personalização de visual do catálogo (aba `Visual`) também fica restrita ao login `zamoht.exe@gmail.com`.

## Documentação

- Documentação detalhada: [`docs/README.md`](docs/README.md)
- Bootstrap B2B (repo/branches): [`docs/B2B-BOOTSTRAP.md`](docs/B2B-BOOTSTRAP.md)
- Licença MIT (cópia em docs): [`docs/LICENSE-MIT.md`](docs/LICENSE-MIT.md)
