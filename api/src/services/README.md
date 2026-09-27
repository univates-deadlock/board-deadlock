# Services

Implementam regras e persistência, sem receber `req` ou `res`.
`user.service.ts` concentra as operações de usuários:

- `userSelect` limita os campos retornados; senha, contas e sessões ficam fora.
- `createUser` usa `hashPassword` do Better Auth e cria usuário + conta `credential`
  em uma transação; o hash segue o mesmo algoritmo usado no login.
- `createInitialAdmin` provisiona o primeiro administrador e recusa sobrescritas.
- `updateUser` revoga sessões ao mudar email/perfil.
- `deactivateUser` mantém o usuário, marca `isActive=false` e apaga suas sessões.
- Alterações que removem um administrador verificam se outro ativo permanece.

As transações de proteção de administradores usam isolamento `Serializable` para
que alterações concorrentes não removam todos os admins. Conflitos retornam
`409`; o cliente pode repetir a operação após atualizar seus dados.

Para consultas únicas use Prisma diretamente. Use transações quando várias
mudanças precisam ser atômicas ou quando a regra depende de uma leitura seguida
de gravação. Erros esperados de negócio usam `AppError`; erros Prisma seguem para
o tratamento global.
