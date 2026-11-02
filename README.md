<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Financeiro

Aplicativo de finanças pessoais com React, TypeScript, Vite e Neon. O banco e a autenticação usam Neon Postgres, Neon Data API e Neon Auth.

## Rodar localmente

Requisitos: Node.js 20 ou superior.

1. Instale as dependências: `npm install`
2. Copie `.env.example` para `.env.local` e configure as URLs públicas da branch Neon.
3. Inicie: `npm run dev`

As variáveis `VITE_NEON_AUTH_URL` e `VITE_NEON_DATA_API_URL` são URLs públicas do serviço; nunca coloque `DATABASE_URL`, senha do Neon ou chave privilegiada em variáveis `VITE_*`.

## Banco e autenticação

As tabelas do app estão em `public` e usam políticas RLS vinculadas ao e-mail autenticado. `migrations/001_neon_rls.sql` documenta os grants e políticas aplicados à branch de produção.

As senhas e sessões do Supabase Auth não são importadas. Usuários existentes devem criar uma nova senha no Neon Auth usando o mesmo e-mail e confirmar o código enviado para recuperar seus dados financeiros. O login social Google precisa ser configurado na branch Neon antes de ser usado.

O armazenamento de assinaturas e trials ainda está no navegador, e o processamento de webhook do Asaas requer uma migração própria antes de uso comercial.
