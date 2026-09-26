# Middlewares

Executam antes/depois dos controllers:

- `requireActiveUser`: valida o cookie com Better Auth, consulta o usuário no banco
  e exige que esteja ativo. Guarda `id`, `role` e `isActive` em `res.locals.user`.
- `requireAdmin`: exige `ADMIN`; deve vir depois de `requireActiveUser`.
- `ErrorHandler`: fica no final de `app.ts`; converte Zod, AppError e falhas Prisma
  em respostas `400/404/409`, além do fallback `500`.

Sem sessão: `401`. Com sessão, mas sem permissão: `403`. Bloquear um botão no
frontend não substitui esses controles no servidor.

Nunca envie stack traces ou mensagens SQL ao cliente. Nunca registre senhas,
cookies ou tokens nos logs. As rotas nativas de autenticação têm tratamento de
erros próprio do Better Auth.
