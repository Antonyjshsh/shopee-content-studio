# Shopee Content Studio — v0.1

Painel web responsivo com autenticação inicial por senha para um administrador, preparado para deploy na Vercel.

## Importante

Esta é uma **primeira interface protegida**. Ainda não inclui upload, edição em lote, IA, links de afiliados, banco de dados ou agendamento real. Para venda a múltiplos clientes, substituir a senha compartilhada por autenticação por usuário, controle de acesso e isolamento de dados.

## Instalação local

```bash
npm install
cp .env.example .env.local
# Preencha STUDIO_PASSWORD (mínimo 12 caracteres) e SESSION_SECRET (mínimo 32 caracteres)
npm run dev
```

Abra http://localhost:3000.

## Vercel

1. Envie o conteúdo **desta pasta** à raiz do repositório privado `shopee-content-studio`.
2. Em Settings > Environment Variables, crie `STUDIO_PASSWORD` e `SESSION_SECRET` com valores fortes diferentes. Marque Production, Preview e Development conforme necessário. Nunca compartilhe os valores.
3. Framework: Next.js; Root Directory: `./`; Build Command: padrão (`next build`).
4. Faça deploy e teste login, logout e acesso direto a `/dashboard` sem autenticação.
5. Só depois configure `studio.nfctechnology.com.br` no projeto e os registros DNS apontados pela Vercel.

## Segurança

- Login com sessão assinada HMAC, cookie HttpOnly, Secure em produção e SameSite Lax.
- Páginas protegidas no servidor e desindexação do site.
- Configurar rate limiting/WAF da Vercel antes de uso aberto, pois o endpoint de login não possui limitação de tentativas.
- Uma senha compartilhada serve apenas para teste privado inicial; não vender acesso usando esta forma de autenticação.
- Não cadastrar chaves de API ou conteúdos sensíveis enquanto não houver autenticação individual, banco seguro e armazenamento adequado.
