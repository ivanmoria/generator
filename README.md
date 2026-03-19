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
├── supabase_setup.sql      ← rode no SQL Editor do Supabase
└── README.md
```

## Configuração do auth.js

Abra `js/auth.js` e preencha as 3 constantes no topo:

```js
const SUPABASE_URL  = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON = 'SUA_ANON_KEY_AQUI';
const GOOGLE_CLIENT_ID = 'SEU_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
```

### 1. Supabase
1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **Settings → API** e copie a **URL** e a **anon key**
3. No **SQL Editor**, rode o conteúdo de `supabase_setup.sql`

### 2. Google Sign-In
1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto → **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
3. Tipo: **Web application**
4. Adicione seus domínios em **Authorized JavaScript origins** (ex: `https://ivanmoria.github.io`)
5. Copie o **Client ID**

## Como liberar acesso pago (após comprovante PIX)

No Supabase, vá em **Table Editor → users** e rode:

```sql
UPDATE public.users
SET paid_at = NOW()
WHERE email = 'email-do-pagante@gmail.com';
```

Ou via **SQL Editor** no painel do Supabase.

## Fluxo de Acesso

| Status | Condição | Acesso |
|--------|----------|--------|
| `anon` | Sem login | Só preview com marca d'água |
| `trial` | Login feito, < 2 min | Acesso completo |
| `expired` | Login feito, > 2 min | Preview com marca d'água; export/draft bloqueados |
| `paid` | `paid_at` preenchido no Supabase | Acesso completo permanente |

## Features Travadas (sem pagamento)

- Exportar PDF / DOCX
- Salvar / Importar rascunho
- Marca d'água no preview

## Duração do Trial

Altere `TRIAL_DURATION_MS` em `auth.js`:
```js
const TRIAL_DURATION_MS = 2 * 60 * 1000; // 2 minutos
// const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
```
