# Schemas Zod

TypeScript verifica tipos em tempo de compilação; Zod valida em tempo de execução os dados externos que chegam pela API:

- `user.schema.ts`: cadastro (nome, e-mail em minúsculas, perfil e senha de 8 a 128 caracteres), edição parcial com pelo menos um campo, envelope `{ userData }` e `userIdSchema` (string não vazia até 128 caracteres, compatível com IDs do Better Auth).
- `client.schema.ts`: tipo (`INDIVIDUAL` ou `COMPANY`), nome, WhatsApp/telefone com validação de DDD brasileiro e formato fixo/celular (10 ou 11 dígitos), documento opcional validado por dígitos verificadores de CPF (`INDIVIDUAL`) ou CNPJ (`COMPANY`), localização e demais campos opcionais/anuláveis (`contactName`, `email` normalizado e `notes`), além de `clientIdSchema` (UUID).
- `quote.schema.ts`: validação de UUIDs (`clientId`, `quoteId`, `quoteItemId`), filtros de listagem (`clientId`, `status`), itens (`PRODUCT`, `SERVICE`, `OTHER`), atualização atômica de cabeçalho/itens em `updateQuoteSchema`, quantidades (`> 0`) e valores monetários (`>= 0`) com no máximo 2 casas decimais e limite de 100 itens por orçamento (`MAX_QUOTE_ITEMS`).

Os objetos de entrada usam `z.strictObject(...)`, recusando campos extras. Use `schema.parse(...)` no controller e `z.infer<typeof schema>` para tipar os `services` — nunca exponha tipos internos do Prisma (`Prisma.*CreateInput`) diretamente ao contrato HTTP.
