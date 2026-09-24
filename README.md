# InjetBox

Sistema de controle de estoque com dois usos:
- `operacao`: gestão completa (cadastro, movimentação, histórico e alertas)
- `catalogo`: consulta pública/cliente com visual personalizado

## Para que serve

- organizar peças e quantidades por empresa
- registrar entrada e saída de estoque
- acompanhar alertas de itens baixos
- publicar catálogo web com identidade visual do cliente

## Começar em 3 passos

```bash
npm install
cp .env.example .env
VITE_APP_MODE=operacao npm run dev
```

Abra `http://localhost:5173/`.

No PowerShell, use:

```powershell
$env:VITE_APP_MODE="operacao"; npm run dev
```

## Modos

- Operação: `VITE_APP_MODE=operacao`
- Catálogo: `VITE_APP_MODE=catalogo`

## Documentação

- Guia detalhado: [`docs/README.md`](docs/README.md)
- Bootstrap comercial: [`docs/B2B-BOOTSTRAP.md`](docs/B2B-BOOTSTRAP.md)
- Licença MIT (cópia): [`docs/LICENSE-MIT.md`](docs/LICENSE-MIT.md)
