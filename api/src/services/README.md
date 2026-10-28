# Services

Concentram regras de negócio, cálculos e persistência via Prisma, sem acoplamento com `req` ou `res`:

- `user.service.ts`: filtra campos públicos (`userSelect`), cria usuário + conta `credential` em transação com `hashPassword` do Better Auth, provisiona o administrador inicial (`createInitialAdmin`), revoga sessões ao desativar ou alterar e-mail/perfil e protege o próprio usuário e o último `ADMIN` ativo com isolamento `Serializable`.
- `client.service.ts`: listagem, consulta por UUID, criação, atualização parcial com verificação de unicidade de e-mail (`409`) e ativação/inativação lógica (`active`).
- `quote.calculations.ts`: funções puras de cálculo monetário usando exclusivamente `Prisma.Decimal` com arredondamento `ROUND_HALF_UP` em 2 casas decimais e verificação de descontos e limites `Decimal(12, 2)` (`422`).
- `quote.service.ts`: listagem com filtros opcionais, consulta detalhada com itens, criação em `DRAFT` para clientes ativos, edição de cabeçalho/itens restrita a orçamentos em aberto (`DRAFT` ou `SENT`), exclusão física restrita a `DRAFT` e bloqueio pessimista (`SELECT ... FOR UPDATE`) para recálculo transacional seguro sob concorrência.

Erros esperados de negócio lançam `AppError`; violações e erros do Prisma seguem para o `globalErrorHandler`.
