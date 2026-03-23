# Chapter Generator — Estrutura Modular

## Estrutura de Arquivos

```
generator/
├── index.html              ← shell HTML, carrega tudo
├── css/
│   ├── main.css            ← estilos principais (linhas 11–971 do original)
│   └── theme.css           ← estilos do painel de tema e modal (linhas 8274–8348)
├── js/
│   ├── lang.js             ← traduções, troca de idioma, campos bilíngues
│   ├── blocks.js           ← blocos de seção, mkBiField, collect()
│   ├── ai.js               ← geração via IA, montagem de prompt
│   ├── export.js           ← exportação HTML/PDF/DOCX
│   ├── draft.js            ← salvar/importar rascunho
│   ├── theme.js            ← painel de tema, color popover, modal de perfil
│   ├── ui.js               ← mobile nav, lang scroll, UI misc
│   └── auth.js             ← ← NOVO: sistema trial + Supabase
└── README.md
```


## Features Travadas (sem pagamento)

- Exportar PDF / DOCX
- Salvar / Importar rascunho
- Marca d'água no preview
