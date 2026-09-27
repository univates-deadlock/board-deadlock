# Biblioteca de persistência

`prisma.ts` cria uma instância de `PrismaClient` com `PrismaPg` e a URL validada.
Services e o adaptador Better Auth compartilham esse cliente.

O cliente tipado vem de `api/generated/prisma`, produzido por `db:generate`.
Não edite essa saída. O servidor mantém o cliente durante sua execução; scripts
que terminam devem chamar `prisma.$disconnect()` em `finally`.
