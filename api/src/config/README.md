# Configuração de ambiente

`env.ts` carrega `.env` e valida as variáveis com Zod antes de iniciar o servidor.
Exporta `env` tipado para Prisma, autenticação, CORS e porta HTTP.

O erro mostra apenas os nomes das variáveis inválidas. Os valores, especialmente
secret e URL com credenciais, não são impressos. Veja `api/.env.example` e
[api/README.md](../../README.md) para preencher a configuração.

Prisma CLI usa `api/prisma.config.ts` e carrega seu `.env` separadamente.
