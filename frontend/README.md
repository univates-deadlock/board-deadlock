# Frontend TechPro

Next.js App Router, React, TypeScript e Tailwind. A página atual ainda é a inicial
do Next.js; a página institucional e as telas da equipe devem ser implementadas
pelos responsáveis conforme o Figma. Esta tarefa implementou a API de autenticação
e usuários, sem criar novas telas.

## Rodar

Na raiz, com Node.js 24:

```bash
npm run install:all
npm run dev --prefix frontend
```

Abra `http://localhost:3000`. A API deve estar em execução para autenticação.
O cliente existente em `lib/auth-client.ts` usa `NEXT_PUBLIC_API_URL`, com fallback
`http://localhost:4000`. Configure a variável no ambiente ou em `.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Nunca coloque secret, URL de banco ou senha em variáveis `NEXT_PUBLIC_`.

## Integração com autenticação

`lib/auth-client.ts` instancia Better Auth para React e inclui cookies:

```typescript
import { authClient } from '@/lib/auth-client';

// Em um Client Component ou handler de interação:
const { error } = await authClient.signIn.email({ email, password });
if (error) {
  // Mostrar a mensagem ao usuário e permanecer na tela de login.
}
const { data: session } = await authClient.getSession();
await authClient.signOut();
```

Login usa contas criadas por um administrador. Cadastro público está desabilitado.
A sessão retorna `null` quando inválida; as rotas protegidas respondem `401`.
Os campos adicionais `role` e `isActive` existem no JSON da sessão; o cliente
atual não adiciona inferência TypeScript desses campos. Use um DTO validado ao
consumi-los ou configure `inferAdditionalFields` antes de usá-los tipadamente.

Chamadas ao CRUD usam a mesma API e precisam incluir cookies:

```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/users`, {
  credentials: 'include',
});
```

Com Axios, configure `withCredentials: true`. As rotas de usuários exigem `ADMIN`;
tratar `403` na interface não substitui a autorização no servidor. Use o mesmo
host em todas as URLs locais (`localhost`, evitando misturá-lo com `127.0.0.1`).
Para erros de autenticação, leia `message`; para erros dos CRUDs, leia `error`.

## Pastas e verificações

- `app/`: páginas, layout e estilos do App Router.
- `lib/`: integrações reutilizáveis, incluindo o cliente de autenticação.
- `public/`: arquivos estáticos.

Server Components são o padrão; use Client Components nas interações que
precisam de estado ou eventos. Leia [o contrato da API](../docs/api-usuarios.md)
para montar os formulários de cadastro/edição.

```bash
npm run check:frontend
```

O comando da raiz executa lint, TypeScript e build. Não há suíte automatizada na
entrega atual. O README principal explica como rodar tudo pelo Compose.
