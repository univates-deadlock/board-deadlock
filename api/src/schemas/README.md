# Schemas Zod

TypeScript valida o código; Zod valida os dados que chegam em tempo de execução.
`user.schema.ts` define o contrato de cadastro, edição, envelope e identificador.

- Cadastro exige nome, email, perfil e senha (8–128 caracteres).
- Edição aceita nome, email e perfil, com pelo menos um campo.
- Nome é aparado; email é aparado e convertido para minúsculas.
- Objetos são estritos: campos extras são recusados.
- IDs são strings não vazias; não restringimos a UUID porque IDs existentes do
  Better Auth podem usar outro formato.

Use `schema.parse(valor)` no controller e `z.infer<typeof schema>` para derivar o
tipo usado no service. Não use `Prisma.UserCreateInput` para validar HTTP: ele
aceita operações de persistência e relações que não pertencem ao contrato.
