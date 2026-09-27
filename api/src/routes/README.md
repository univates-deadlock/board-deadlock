# Rotas

Uma rota associa método e caminho a um controller. O prefixo `/api/users` é
registrado em `app.ts`; portanto `router.get('/')` atende `GET /api/users`.

Em `user.route.ts`, `router.use(requireActiveUser, requireAdmin)` protege todas as
operações do módulo. Não repita a autenticação em cada controller nem remova o
middleware para facilitar chamadas do frontend.

O health é público. As rotas `/api/auth/*` são montadas diretamente em `app.ts`
pelo handler do Better Auth.

Para outro CRUD: crie um router, escolha as permissões adequadas ao requisito,
importe seus controllers e registre o prefixo em `app.ts`.
