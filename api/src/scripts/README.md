# Scripts locais

`create-admin.ts` é o provisionamento inicial, executado por `npm run admin:create`.
Lê `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` do ambiente, valida com o mesmo
schema do CRUD e chama `createInitialAdmin`.

Não é uma rota pública. Não cria dados automaticamente ao iniciar o servidor.
Recusa outro administrador ativo e email existente, não imprime senha e encerra
o cliente Prisma ao terminar. Veja o comando com leitura oculta de senha no
[README da API](../../README.md).
