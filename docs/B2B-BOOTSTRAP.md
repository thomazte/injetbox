# InjetBox B2B Bootstrap

Passo a passo para reiniciar o repositório com histórico limpo e adotar fluxo de branches comercial.

## 1) Novo repositório remoto

Crie um repositório vazio no GitHub, sem README inicial.

Exemplo: `https://github.com/<sua-conta>/injetbox-b2b.git`

## 2) Histórico limpo local

Na raiz do projeto:

```bash
git checkout --orphan main
git add -A
git commit -m "InjetBox B2B: base inicial"
```

Se existir branch principal antiga:

```bash
git branch -D old-main
```

## 3) Apontar para novo origin

```bash
git remote remove origin
git remote add origin https://github.com/<sua-conta>/injetbox-b2b.git
git push -u origin main
```

## 4) Estratégia de branches

```bash
git checkout -b develop
git push -u origin develop
```

Padrões:

- `main`: produção (somente release/hotfix)
- `develop`: integração da sprint
- `feature/*`: funcionalidades
- `hotfix/*`: correções urgentes
- `release/*`: estabilização de versão
