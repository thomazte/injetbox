# InjetBox

Sistema de controle de estoque com 3 modos (`demo`, `operacao`, `catalogo`) e tema por empresa.

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
- Android (APK): `npm run android:apk`

## Modos de execução

- Demo: `$env:VITE_APP_MODE="demo"; npm run dev`
- Operação: `$env:VITE_APP_MODE="operacao"; npm run dev`
- Catálogo: `$env:VITE_APP_MODE="catalogo"; npm run dev`

## Documentação

- Documentação detalhada: [`docs/README.md`](docs/README.md)
- Bootstrap B2B (repo/branches): [`docs/B2B-BOOTSTRAP.md`](docs/B2B-BOOTSTRAP.md)
- Licença MIT (cópia em docs): [`docs/LICENSE-MIT.md`](docs/LICENSE-MIT.md)
