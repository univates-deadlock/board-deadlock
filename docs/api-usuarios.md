# API de usuários — contrato e demonstração

Este guia permite reproduzir a entrega sem uma tela de frontend. Use Bash, curl
(e opcionalmente jq) com a API e o banco já preparados conforme o
[README da API](../api/README.md).

## Resumo do contrato

Base local: `http://localhost:4000`.

| Método | Caminho | Sucesso | Permissão |
| --- | --- | --- | --- |
| GET | `/api/health` | `200` | público |
| POST | `/api/auth/sign-in/email` | `200` e cookie | credenciais válidas, usuário ativo |
| GET | `/api/auth/get-session` | `200`, sessão ou `null` | cookie opcional |
| POST | `/api/auth/sign-out` | `200` | encerra a sessão atual |
| GET | `/api/users` | `200`, lista incluindo inativos | `ADMIN` ativo |
| GET | `/api/users/:id` | `200`, usuário | `ADMIN` ativo |
| POST | `/api/users` | `201`, usuário e credencial criados | `ADMIN` ativo |
| PATCH | `/api/users/:id` | `200`, usuário atualizado | `ADMIN` ativo |
| PATCH | `/api/users/:id/activate` | `204` | `ADMIN` ativo |
| PATCH | `/api/users/:id/deactivate` | `204` | `ADMIN` ativo |
| DELETE | `/api/users/:id` | `204`, exclusão lógica | `ADMIN` ativo |

Cadastro público (`/api/auth/sign-up/email`) está bloqueado. Crie o primeiro
administrador pelo comando `admin:create`. O sistema não mantém uma senha padrão.

## 1. Login e sessão

Use o email e a senha escolhidos no provisionamento. O exemplo abaixo lê a senha
sem eco e a envia por stdin; ela não aparece no histórico como argumento do curl.

```bash
TECHPRO_URL=http://localhost:4000
TECHPRO_COOKIE_FILE=$(mktemp)
export LOGIN_EMAIL='admin@example.com'
read -r -s -p 'Senha: ' LOGIN_PASSWORD
printf '\n'
export LOGIN_PASSWORD
node --input-type=module -e 'process.stdout.write(JSON.stringify({email: process.env.LOGIN_EMAIL, password: process.env.LOGIN_PASSWORD}))' \
  | curl -i -c "$TECHPRO_COOKIE_FILE" \
      -H 'Content-Type: application/json' \
      -H 'Origin: http://localhost:3000' \
      --data-binary @- "$TECHPRO_URL/api/auth/sign-in/email"
unset LOGIN_EMAIL LOGIN_PASSWORD
```

O login responde `200`, informa o usuário e envia `Set-Cookie`. Não publique a
resposta completa nem o cookie: ambos podem conter material de sessão. Para
slides, oculte tokens, cookies e senhas.

```bash
curl -sS -b "$TECHPRO_COOKIE_FILE" "$TECHPRO_URL/api/auth/get-session"
```

A sessão deve conter o usuário e seu perfil. Sem cookie válido, a resposta é
`null`. O arquivo temporário de cookies deve ficar fora do repositório.

## 2. Cadastro — C

Este exemplo usa **dados fictícios**. O campo `password` é obrigatório no cadastro;
ele não é aceito na edição genérica nem retornado na resposta.

```bash
curl -i -b "$TECHPRO_COOKIE_FILE" \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3000' \
  -d '{"userData":{"name":"Técnico Demo","email":"tecnico@example.com","role":"TECHNICIAN","password":"DemoOnly_2026!"}}' \
  "$TECHPRO_URL/api/users"
```

Resultado: `201` com `id`, `name`, `email`, `role`, `isActive`, `createdAt` e
`updatedAt`. Guarde o ID retornado para os próximos comandos:

```bash
TECHPRO_USER_ID='cole-aqui-o-id-retornado'
```

No código: middleware de sessão/perfil → controller valida o envelope `userData`
→ service gera hash com Better Auth → transação grava usuário e conta credential
→ Prisma devolve somente os campos de `userSelect` → controller responde `201`.

## 3. Listagem e consulta — R

```bash
curl -sS -b "$TECHPRO_COOKIE_FILE" "$TECHPRO_URL/api/users"
curl -sS -b "$TECHPRO_COOKIE_FILE" "$TECHPRO_URL/api/users/$TECHPRO_USER_ID"
```

A lista inclui inativos e é ordenada do cadastro mais recente para o mais antigo.
Não há paginação nesta primeira entrega. ID inexistente responde `404`.

## 4. Edição — U

```bash
curl -i -X PATCH -b "$TECHPRO_COOKIE_FILE" \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3000' \
  -d '{"userData":{"name":"Técnico atualizado","role":"PLANNING"}}' \
  "$TECHPRO_URL/api/users/$TECHPRO_USER_ID"
```

Retorna `200` com o usuário atualizado. A edição aceita pelo menos um campo entre
`name`, `email` e `role`. `updatedAt` é atualizado pelo Prisma. Mudar email ou
perfil revoga todas as sessões do usuário; ele deve fazer login novamente.
Mudar apenas o nome mantém as sessões.

O cliente não pode definir ID, datas, `emailVerified`, relações, senha ou
`isActive` pelo PATCH genérico. Objetos e envelopes são estritos.

## 5. Exclusão lógica — D e reativação

```bash
curl -i -X DELETE -b "$TECHPRO_COOKIE_FILE" \
  -H 'Origin: http://localhost:3000' \
  "$TECHPRO_URL/api/users/$TECHPRO_USER_ID"
```

Resultado: `204`, sem body. O registro permanece no banco com `isActive=false`,
seus vínculos são preservados e as sessões são apagadas. Isso implementa o RF02
(ativar/desativar), com verbo DELETE para exclusão lógica. Confirmar com o
professor a aceitação dessa semântica para a rubrica; não há exclusão física.

A rota `PATCH /api/users/:id/deactivate` executa a mesma operação.

```bash
curl -i -X PATCH -b "$TECHPRO_COOKIE_FILE" \
  -H 'Origin: http://localhost:3000' \
  "$TECHPRO_URL/api/users/$TECHPRO_USER_ID/activate"
```

Resultado: `204`. Reativação permite novo login; ela não restaura sessões antigas.
Tentar desativar a si mesmo ou retirar o próprio perfil admin responde `409`.
A aplicação também impede remover o último administrador ativo.

## 6. Robustez e permissões

### Dados inválidos

```bash
curl -i -b "$TECHPRO_COOKIE_FILE" \
  -H 'Content-Type: application/json' \
  -d '{"userData":{"name":"","email":"invalido","role":"OUTRO","password":"curta"}}' \
  "$TECHPRO_URL/api/users"
```

Resultado `400`, com `error` e lista `fields` contendo caminhos e mensagens.
`name` é aparado; email é aparado e convertido para minúsculas; senha não é aparada.
Perfis aceitos: `ADMIN`, `PLANNING`, `TECHNICIAN`.

Outros casos:

- Repetir email cadastrado: `409`.
- Enviar `userData: {}` para edição: `400`.
- Enviar campos extras (por exemplo `isActive` no cadastro): `400`.
- Consultar/editar ID inexistente: `404`.
- Chamar `/api/users` sem cookie: `401`.
- Fazer login como `PLANNING`/`TECHNICIAN` e chamar `/api/users`: `403`.
- Fazer login com usuário inativo e senha correta: `403`.
- Fazer login com senha incorreta: `401`.
- Enviar mais requisições que o limite: `429`.

Erros de CRUD: `{ "error": "mensagem", "fields": [...] }`, com `fields` somente
quando aplicável. Erros nativos do Better Auth usam `code`/`message`.

## 7. Logout

```bash
curl -i -X POST -b "$TECHPRO_COOKIE_FILE" -c "$TECHPRO_COOKIE_FILE" \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3000' \
  -d '{}' "$TECHPRO_URL/api/auth/sign-out"
curl -sS -b "$TECHPRO_COOKIE_FILE" "$TECHPRO_URL/api/auth/get-session"
```

Logout responde `200`; consulta seguinte retorna `null`; o CRUD volta a responder
`401`. Ao terminar, remova apenas o arquivo temporário que você criou:

```bash
rm -- "$TECHPRO_COOKIE_FILE"
unset TECHPRO_COOKIE_FILE TECHPRO_URL TECHPRO_USER_ID
```

## Fluxo para explicar aos colegas

| Camada | Pergunta que ela resolve | Arquivo |
| --- | --- | --- |
| Route | Qual operação atende esse caminho? | `user.route.ts` |
| Middleware | Quem chama e tem permissão? | `requireActiveUser.ts`, `requireAdmin.ts` |
| Controller | O HTTP é válido e qual status responder? | `user.controller.ts` |
| Schema | Quais campos e valores são aceitos? | `user.schema.ts` |
| Service | Quais regras e mudanças precisam ocorrer juntas? | `user.service.ts` |
| Prisma | Como persistir e relacionar esses dados? | `schema.prisma`, `lib/prisma.ts` |
| Error handler | Como transformar uma falha em resposta pública? | `ErrorHandler.ts` |

Para o segundo CRUD, reaproveite o padrão, não copie permissões de usuários sem
conferir o requisito. A API de usuários é restrita a admin; outros recursos podem
admitir planejamento ou técnicos conforme suas regras.

## Evidências e limites desta entrega

Verificação funcional feita por HTTP real com PostgreSQL em um banco separado,
com as quatro migrations e dados fictícios: login, sessão, cadastro, leitura,
edição, validação, conflito de email, exclusão lógica, reativação, autorização,
revogação e logout. Não foi criada uma suíte automatizada de testes.

A entrega de API não inclui tela de login, página institucional ou segundo CRUD.
Para a apresentação por slides, capture cada fluxo, associe as tarefas aos nomes
reais da equipe, mostre commits e branches reais e explique as decisões de
hash de senha, cookies, transações e exclusão lógica. Todos precisam entender
sua parte, mesmo quem não falar durante os dez minutos de apresentação.
