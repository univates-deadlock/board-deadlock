# Middlewares

Executam antes ou depois dos controllers:

- `requireActiveUser`: valida o cookie com Better Auth, consulta o usuário no PostgreSQL e exige `isActive = true`. Armazena `{ id, role, isActive }` em `res.locals.user`.
- `requireAdmin`: exige `role === "ADMIN"`; deve vir após `requireActiveUser`.
- `requireRole`: fábrica `requireRole(...allowedRoles)` que restringe o acesso aos perfis informados (ex.: `ADMIN` e `PLANNING` em clientes e orçamentos); deve vir após `requireActiveUser`.
- `ErrorHandler`: registrado no final de `app.ts`; converte `ZodError`, `AppError` e erros conhecidos do Prisma em respostas padronizadas (`400`, `404`, `409`, `413`, `422`), além do fallback genérico `500`.

Sem sessão válida: `401`. Com sessão, mas inativo ou sem permissão: `403`. Ocultar controles no frontend não substitui esses middlewares no servidor.

Nunca envie stack traces ou mensagens SQL ao cliente e nunca registre senhas, cookies ou tokens nos logs. As rotas nativas `/api/auth/*` possuem tratamento de erros próprio do Better Auth.
