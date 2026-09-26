# Prisma e banco

`schema.prisma` descreve entidades, campos, relações e enums. O schema atual já
inclui entidades de negócio; isso não significa que seus endpoints já existam.
Autenticação usa `User`, `Account`, `Session` e `Verification`.

- `User`: perfil e atividade, sem senha.
- `Account`: credencial de login; senha contém um hash.
- `Session`: login persistido, token e expiração.
- `Verification`: estrutura da biblioteca para fluxos futuros de verificação.

Comandos da raiz:

```bash
npm run db:validate --prefix api
npm run db:generate --prefix api
npm run db:migrate --prefix api
```

Migrations já aplicadas não devem ser reescritas. Para futuras alterações, ajuste
o schema e crie uma migration nova em um banco de desenvolvimento:

```bash
cd api
npx prisma migrate dev --name descricao_da_alteracao
```

Revise o SQL antes de compartilhar. `migrate deploy` aplica migrations existentes,
mas não cria novas. Não use reset em um banco que contém dados importantes.
`uuid()` e `@updatedAt` são comportamentos gerenciados pelo cliente Prisma.
