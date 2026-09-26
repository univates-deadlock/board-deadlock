# Código da API

`index.ts` lê a configuração e abre a porta; `app.ts` monta o Express e exporta a
aplicação. A separação permite reutilizar o app sem abrir uma porta ao importá-lo.

Ordem em `app.ts`: CORS → Helmet → rate limit → handler Better Auth → parser JSON
→ rotas → tratamento global de erros. Better Auth recebe a requisição antes de
`express.json()`, conforme sua integração com Node/Express.

Para CRUDs, siga `routes → middlewares → controllers → schemas → services → Prisma`.
HTTP permanece no controller; consultas e regras ficam no service. Os schemas
fazem a ponte entre JSON não confiável e tipos TypeScript.

Consulte o [guia da API](../README.md) e os READMEs das subpastas.
