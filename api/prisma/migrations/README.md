# Histórico de migrations

As pastas são aplicadas em ordem pelo Prisma:

1. `20260925141227_initial_database`: entidades e enums iniciais.
2. `20260925155124_better_auth_modifications`: adaptação para Better Auth.
3. `20260925162454_user_active`: campo `isActive`.
4. `20260926000000_user_management`: reintroduz perfil e default de email não verificado.

A migration antiga de Better Auth remove campos antigos de usuário, incluindo
senha e perfil. Ela foi preservada; antes de aplicá-la em uma base antiga com
dados, planeje a migração desses dados. O histórico foi verificado em uma base
separada vazia, sem reset do banco de trabalho.

A migration nova atribui `TECHNICIAN` aos registros existentes. Não promove admins
automaticamente. O comando `admin:create` cria um admin quando ainda não há um
ativo, sem sobrescrever usuários. Os IDs gerados e o horário de edição são
controlados pelo Prisma, não por triggers adicionadas nessa migration.
