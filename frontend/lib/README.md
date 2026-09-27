# Integrações do frontend

`auth-client.ts` cria o cliente Better Auth para React. A base vem de
`NEXT_PUBLIC_API_URL`, com fallback para `http://localhost:4000`, e as chamadas
incluem cookies (`credentials: include`).

Use esse cliente em interações de Client Components para login, sessão e logout.
Não importe `api/src/utils/auth.ts` no frontend: ele depende de Prisma e secrets
que pertencem ao servidor. O cliente também não define permissões; a API valida
perfil e atividade em cada chamada ao CRUD.

Veja [o guia do frontend](../README.md) para exemplos e [a API](../../api/README.md)
para provisionar o primeiro administrador.
