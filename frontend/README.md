# Frontend TechPro

Next.js App Router, React, TypeScript e Tailwind. A tela de login e o shell
interno estão implementados; as telas de orçamentos e de pendências entram quando
a API expuser os endpoints correspondentes.

## O que a tela de login cobre

- **Estados tratados**: verificação da sessão, envio em andamento, sucesso e falha.
- **Erros distintos**: credencial inválida (`401`) mostra uma mensagem única que não
  revela se o email existe; usuário inativo (`403`) explica que é preciso procurar um
  administrador; falha de servidor oferece nova tentativa.
- **Duplo envio bloqueado**: o botão fica indisponível durante a requisição e o Enter
  no formulário tem a mesma proteção.
- **Acessibilidade**: campos com `label` visível, erro ligado ao campo por
  `aria-describedby`, `aria-invalid` no estado inválido, mensagem em `role="alert"`,
  foco devolvido ao primeiro campo após falha e navegação completa por teclado.
- **Responsive layout**: the brand panel sits beside the form from 1024px onward
  and becomes a compact banner above the form on smaller screens.

A autorização de verdade continua no backend: esconder um botão na interface não é
controle de acesso, e as rotas protegidas respondem `401`/`403` por conta própria.

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

For server-side session checks, set `API_INTERNAL_URL` when the Next.js server
cannot reach the browser-facing API address. Docker Compose already sets it to
`http://api:4000`. Without it, the server uses `NEXT_PUBLIC_API_URL` and then
`http://localhost:4000`. The browser must send the Better Auth session cookie to
the frontend host as well; the local setup uses `localhost` for both ports.

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

## Protected frontend pages

The `/` page calls `requireActiveSession()` on the server before rendering its
internal content. The helper forwards the incoming cookie to the trusted API's
`GET /api/auth/get-session` endpoint without caching the response. Missing,
invalid, or inactive sessions redirect to `/login` immediately. If the API is
unavailable, the page fails closed and does not render internal content.

Call the same helper at the start of each future protected page. The API still
enforces authentication and permissions for its own routes; a frontend redirect
does not replace those checks.

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

- `app/`: páginas, layout e estilos do App Router. `app/login/` é a tela de entrada.
- `components/ui/`: primitivos reutilizáveis (`Button`, `Field`, `Alert`), com as
  mesmas regras visuais do site institucional.
- `lib/`: integrações reutilizáveis — `auth-client.ts` (Better Auth) e `api.ts`
  (cliente HTTP com `credentials: include` e erros normalizados).
- `public/`: arquivos estáticos.

Os tokens de design (cores, tipografia, espaçamento, raios) ficam em
`app/globals.css` e vêm do site institucional, para o sistema interno ter a mesma
identidade visual. Prefira as variáveis do tema a valores fixos nos componentes.

Server Components são o padrão; use Client Components nas interações que
precisam de estado ou eventos. Leia [o contrato da API](../docs/api-usuarios.md)
para montar os formulários de cadastro/edição.

```bash
npm run check:frontend
```

O comando da raiz executa lint, TypeScript e build. Não há suíte automatizada na
entrega atual. O README principal explica como rodar tudo pelo Compose.
