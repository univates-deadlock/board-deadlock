# Controllers

Recebem `Request`, `Response` e `NextFunction`. Fazem três coisas:

1. Validam `body` e `params` com os schemas Zod.
2. Chamam o service usando apenas os dados validados.
3. Respondem com status HTTP e JSON, ou encaminham o erro com `next(error)`.

Em `createUser`, o body é `{ userData: { name, email, role, password } }` e o
resultado usa `201`. Edição responde `200`; ativação e desativação usam `204`,
sem corpo. Consulta inexistente gera `AppError` com status `404`.

O ID de quem executa a operação vem de `res.locals.user`, preenchido pelo
middleware de sessão; nunca do body enviado pelo cliente.

Não faça consultas Prisma ou hashing de senha aqui. Isso pertence ao service.
