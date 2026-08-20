# InjetBox

Controle de estoque. © ZamohtExe. Todos os direitos reservados. Veja `LICENSE`.

## Desenvolvimento

```powershell
npm install
copy .env.example .env
npm run dev
```

Abre http://localhost:5173/

- Windows: `npm run desktop` / `npm run desktop:build`
- Android: `npm run android:apk`

## CI e restore

- Cada push em `main` roda o workflow **CI** (lint + build).
- Documentação: [`docs/README.md`](docs/README.md)
