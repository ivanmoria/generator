# IAPs · Gerador de Páginas

Ferramenta para gerar páginas HTML bilíngues (PT/EN) do projeto IAPs — Improvisation Assessment Profiles (Bruscia, 1987).

---

## Estrutura do projeto

```
iaps-backend/
├── server.js          ← backend Node.js (proxy para a API Anthropic)
├── package.json
├── .gitignore
├── iaps-gerador.html  ← frontend do gerador (vai para o GitHub Pages)
└── README.md
```

---

## Passo 1 — Criar repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique em **New repository**
3. Nome sugerido: `iaps-backend`
4. Deixe **Public**
5. Clique em **Create repository**
6. Suba todos os arquivos deste projeto para o repositório

---

## Passo 2 — Deploy do backend no Railway

1. Acesse [railway.app](https://railway.app) e faça login com sua conta GitHub
2. Clique em **New Project → Deploy from GitHub repo**
3. Selecione o repositório `iaps-backend`
4. O Railway detecta automaticamente o `package.json` e faz o deploy

### Configurar a chave da API Anthropic no Railway

1. No painel do Railway, clique no seu serviço
2. Vá em **Variables**
3. Clique em **New Variable**
4. Nome: `ANTHROPIC_API_KEY`
5. Valor: sua chave da Anthropic (começa com `sk-ant-...`)
   - Obtenha em: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
6. Clique em **Add**
7. O Railway vai reiniciar o serviço automaticamente

### Pegar a URL do backend

1. No Railway, clique em **Settings → Networking → Generate Domain**
2. Copie a URL gerada — será algo como:
   ```
   https://iaps-backend-production-xxxx.up.railway.app
   ```

---

## Passo 3 — Publicar o frontend no GitHub Pages

1. No seu repositório GitHub, vá em **Settings → Pages**
2. Em **Source**, selecione `main` e pasta `/root`
3. Clique em **Save**
4. Após alguns minutos, o gerador estará disponível em:
   ```
   https://SEU-USUARIO.github.io/iaps-backend/iaps-gerador.html
   ```

---

## Como usar o gerador

1. Abra o `iaps-gerador.html` (pelo GitHub Pages ou localmente com um servidor HTTP)
2. **Cole a URL do Railway** no campo "URL do backend" no topo da página
3. Preencha os metadados do capítulo
4. Adicione as seções com o texto em inglês
5. Clique em **⚡ Gerar Página HTML**
6. Baixe o arquivo `.html` gerado — já bilíngue e no estilo IAPs

---

## Observações

- O arquivo gerado depende de `iaps.css` e `iaps.js` na mesma pasta
- O backend não armazena nenhum dado — apenas faz proxy para a API Anthropic
- O plano gratuito do Railway dá 500 horas/mês — suficiente para uso pessoal

---

**Projeto:** Improvisação em Musicoterapia I · UFMG · 2026  
**Interface:** Ivan Moriá Borges  
**Fonte:** Bruscia, K. E. — *Improvisational Models of Music Therapy*, 1987
