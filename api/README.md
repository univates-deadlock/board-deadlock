# API TechPro

API REST em Express 5, TypeScript, Zod, Prisma 7 e PostgreSQL. Autenticação e
sessão usam Better Auth. Leia primeiro o [README principal](../README.md).

## O que esta entrega implementa

- Login por email/senha, consulta da sessão e logout com cookie HTTP-only.
- Administração de usuários com os perfis `ADMIN`, `PLANNING` e `TECHNICIAN`.
- Cadastro, consulta, edição, ativação e inativação de clientes por `ADMIN` e `PLANNING`.
- Cadastro com senha, listagem, consulta, edição, ativação e exclusão lógica.
- Validação de payloads, permissões no servidor e erros HTTP padronizados.
- Revogação das sessões na desativação e na alteração de email/perfil.

Somente `ADMIN` administra usuários. Cadastro público está desabilitado. Edição nativa de perfil, exclusão nativa e
mudança nativa de email estão bloqueadas; alterações de perfil usam o CRUD admin. O primeiro
administrador é criado pelo comando local abaixo; os demais usam o CRUD.
Google, recuperação de senha por email e tela de login não fazem parte desta tarefa.

## Instalar e configurar

Execute os comandos abaixo na **raiz do repositório**, com Node.js 24 e npm.

```bash
npm run install:all
docker compose up -d db
```

Se ainda não existe `api/.env`, copie `api/.env.example` para `api/.env`.

```bash
if [ ! -f api/.env ]; then
  cp api/.env.example api/.env
fi
```

Se já existe, preserve os valores e adicione as variáveis ausentes.

| Variável | Uso | Valor local |
| --- | --- | --- |
| `PORT` | Porta HTTP da API | `4000` |
| `DATABASE_URL` | Conexão PostgreSQL | exemplo em `.env.example` |
| `BETTER_AUTH_URL` | Endereço público da API | `http://localhost:4000` |
| `FE_BASE_URL` | Origem permitida do frontend | `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | Assinatura de cookies, mínimo 32 caracteres | gerar abaixo |

Gere o secret local sem imprimi-lo no terminal (comando para Bash):

```bash
node --input-type=module - <<'NODE'
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const path = 'api/.env';
const contents = readFileSync(path, 'utf8');
if (/^BETTER_AUTH_SECRET=.+$/m.test(contents)) {
  console.log('Secret existente preservado.');
} else {
  const clean = contents.replace(/^BETTER_AUTH_SECRET=.*\n?/m, '');
  writeFileSync(path, clean.trimEnd() + '\nBETTER_AUTH_SECRET=' + randomBytes(32).toString('hex') + '\n');
  console.log('Secret local configurado.');
}
NODE
```

O secret deve permanecer estável entre reinícios para que os cookies continuem
válidos. `api/.env` é ignorado pelo Git. Nunca use `NEXT_PUBLIC_` para esse secret.
O frontend recebe apenas a URL pública da API.

Prepare o banco e inicie:

```bash
npm run db:validate --prefix api
npm run db:generate --prefix api
npm run db:migrate --prefix api
npm run dev --prefix api
```

- `db:validate` verifica o schema.
- `db:generate` produz o cliente tipado em `generated/`.
- `db:migrate` aplica as migrations versionadas que ainda não foram executadas.
- `dev` inicia o Express com recarga automática.

`GET http://localhost:4000/api/health` deve responder `200`. O health indica que
o servidor HTTP está disponível; não é uma consulta de conectividade do banco.
Para subir tudo pelo Docker, veja o README principal. O Compose aplica migrations
no startup, mas não cria um administrador automaticamente.

## Criar o primeiro administrador

Com o banco preparado, abra outro terminal Bash na raiz:

```bash
export ADMIN_NAME='Administrador da equipe'
export ADMIN_EMAIL='admin@example.com'
read -r -s -p 'Senha inicial (8 a 128 caracteres): ' ADMIN_PASSWORD
printf '\n'
export ADMIN_PASSWORD
npm run admin:create --prefix api
unset ADMIN_NAME ADMIN_EMAIL ADMIN_PASSWORD
```

A senha é lida sem aparecer na tela e não é passada como argumento do comando.
O script cria `User` e uma conta `credential` com hash de senha. Ele recusa a
operação se já houver administrador ativo ou se o email já existir; não promove
nem sobrescreve usuários existentes. Para Docker, substitua o comando npm por:

```bash
docker compose exec -e ADMIN_NAME -e ADMIN_EMAIL -e ADMIN_PASSWORD api npm run admin:create
```

Caso prefira declarar as variáveis `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `api/.env`, execute apenas `docker compose exec api npm run admin:create` (e remova `ADMIN_PASSWORD` do arquivo após a criação).

Use o email e a senha escolhidos para login. Usuários criados anteriormente sem
conta `credential` não ganham senha automaticamente; requerem provisionamento
antes de poderem fazer login. Não faça `migrate reset` para resolver esse caso.

## Como o login funciona

1. O cliente envia email e senha para `POST /api/auth/sign-in/email`.
2. Better Auth busca `User` e a conta `credential`, verifica o hash da senha e
   passa pelo hook que impede login de usuário inativo.
3. A biblioteca cria uma linha em `Session` e responde com cookie HTTP-only.
4. O navegador envia esse cookie nas chamadas seguintes. Com frontend separado,
   use `credentials: 'include'`; com Axios, `withCredentials: true`.
5. `GET /api/auth/get-session` retorna a sessão e o usuário, ou `null` sem sessão
   válida. Cookies são gerenciados pela biblioteca, não por `localStorage`.
6. `POST /api/auth/sign-out` revoga a sessão atual e limpa o cookie.

A duração configurada é sete dias, com atualização periódica após um dia. Cache
em cookie está desligado; desativação remove as sessões persistidas. Perfis e
atividade são consultados no banco em cada chamada às rotas de usuários.
Após criar a sessão, um hook bloqueia a linha do usuário e revalida sua atividade
antes de confirmar o login; isso coordena login simultâneo com desativação.
Better Auth controla proteção de origem/CSRF nas rotas de autenticação; não a
remova para contornar um erro de frontend. O rate limiter de autenticação está
ativado também em desenvolvimento e usa memória por processo.

## Rotas e payloads

Veja os contratos e exemplos em [usuários](../docs/api-usuarios.md) e
[clientes](../docs/api-clientes.md).

| Método | Caminho | Acesso |
| --- | --- | --- |
| GET | `/api/health` | público |
| POST | `/api/auth/sign-in/email` | público, valida credenciais |
| GET | `/api/auth/get-session` | retorna sessão ou `null` |
| POST | `/api/auth/sign-out` | encerra sessão atual |
| GET / POST | `/api/users` | administrador ativo |
| GET / PATCH / DELETE | `/api/users/:id` | administrador ativo |
| PATCH | `/api/users/:id/activate` | administrador ativo |
| PATCH | `/api/users/:id/deactivate` | administrador ativo |
| GET / POST | `/api/clients` | administrador ou planejamento ativo |
| GET / PATCH / DELETE | `/api/clients/:id` | administrador ou planejamento ativo |
| PATCH | `/api/clients/:id/activate` | administrador ou planejamento ativo |
| PATCH | `/api/clients/:id/deactivate` | administrador ou planejamento ativo |

`DELETE` é exclusão lógica. Em usuários, define `isActive=false`; em clientes,
define `active=false`. Os registros continuam disponíveis para consulta e podem
ser reativados. Não é permitido desativar a si mesmo, retirar o próprio perfil
admin ou remover o último administrador ativo.

## Organização do código

```text
src/
  index.ts        inicia o servidor HTTP
  app.ts          monta middlewares e rotas
  config/         valida variáveis de ambiente
  routes/         associa método/caminho ao controller
  middlewares/    sessão, perfil e tratamento global de erros
  controllers/    traduz HTTP em chamadas ao service
  schemas/        valida entradas com Zod e deriva tipos
  services/       regras de usuários, consultas e transações
  lib/            cliente Prisma com adaptador PostgreSQL
  utils/          configuração do Better Auth, CORS, rate limit e AppError
  scripts/        provisionamento local do administrador
prisma/
  schema.prisma   estrutura dos dados
  migrations/     histórico SQL versionado
```

Cada pasta tem um README curto explicando sua responsabilidade. Para estudar um
cadastro, leia nesta ordem: `routes/user.route.ts`, `middlewares/requireActiveUser.ts`,
`middlewares/requireAdmin.ts`, `controllers/user.controller.ts`,
`schemas/user.schema.ts`, `services/user.service.ts` e `prisma/schema.prisma`.

## Erros e verificações

| Status | Significado |
| --- | --- |
| `400` | JSON/payload inválido; falhas Zod incluem `fields` |
| `401` | sessão ausente/expirada ou credenciais incorretas |
| `403` | perfil sem permissão ou usuário inativo |
| `404` | usuário inexistente |
| `409` | email duplicado, proteção de administrador ou conflito concorrente |
| `413` | corpo maior que 100 KB nas rotas JSON da aplicação |
| `429` | excesso de requisições |
| `500` | falha inesperada, sem detalhes internos na resposta |

Erros das rotas `/api/auth/*` usam o formato nativo do Better Auth (`code` e
`message`); erros dos CRUDs usam `{ error, fields? }`. Os consumidores devem
tratar o status HTTP em ambos os casos.

```bash
npm run check:api
```

## Testes automatizados

A API conta com testes automatizados desenvolvidos com **Vitest**, **Supertest**, **Prisma** e **PostgreSQL**, estruturados em testes unitários e de integração.

### Tecnologias e pré-requisitos

- **Node.js 24** e dependências instaladas (`npm ci --prefix api`).
- **Prisma Client** gerado (`npm run db:generate --prefix api`).
- **Docker** com daemon em execução (necessário apenas para os testes de integração).

### Comandos de execução

```bash
# Executa toda a suíte (unitários e integração)
npm test --prefix api

# Executa apenas os testes unitários (não requer Docker nem banco de dados)
npm run test:unit --prefix api

# Executa apenas os testes de integração (requer Docker para o banco isolado)
npm run test:integration --prefix api
```

### Diferença entre testes unitários e de integração

- **Testes unitários (`*.unit.test.ts`):** avaliam funções puras de regras de negócio (cálculos de itens e totais de orçamentos) em memória, sem depender de banco de dados ou Docker.
- **Testes de integração (`*.integration.test.ts`):** validam requisições HTTP reais com Supertest contra o servidor Express, cobrindo autenticação por cookies com Better Auth, autorização por perfil (RBAC), validação com Zod e persistência real no PostgreSQL.

### Principais testes cobertos

1. **Permissões (RBAC):** valida o controle de acesso por perfil (`ADMIN`, `PLANNING` e `TECHNICIAN`), comprovando que técnicos autenticados recebem HTTP `403 Forbidden` ao tentar operações de planejamento ou administrativas, e requisições anônimas recebem HTTP `401 Unauthorized`.
2. **Cálculo de orçamentos:** valida as regras de `quote.calculations.ts` com tipos `Decimal` (quantidade × valor unitário, desconto de item, soma de subtotais, desconto geral, total líquido e rejeição de descontos superiores ao subtotal).
3. **CRUD de orçamentos:** valida o ciclo de vida completo via HTTP e PostgreSQL real (criação de rascunho com itens e totais calculados no servidor, consulta do registro, atualização de dados, verificação da persistência, exclusão do rascunho e confirmação da exclusão com `404`).

### Banco descartável para integração

A infraestrutura em `tests/global-setup.ts` inicializa um container PostgreSQL (`postgres:17-alpine`) descartável em porta dinâmica de loopback (`127.0.0.1`), aplica as migrations necessárias via `prisma migrate deploy` e descarta o container ao final dos testes ou em interrupções (`SIGINT`/`SIGTERM`). Se o Docker não estiver em execução, uma mensagem clara orienta o desenvolvedor. Nenhum banco de desenvolvimento ou produção é utilizado.

### Execução no GitHub Actions (CI)

No workflow `.github/workflows/ci.yml`, o job `api` executa `npm test` após as etapas de `lint`, `typecheck` e `build`. No ambiente do runner (`ubuntu-latest`), o Docker já está disponível, permitindo a execução automática tanto dos testes unitários quanto dos de integração sem necessidade de secrets de produção.

## Problemas comuns

- **Configuração inválida:** revise os nomes de variáveis indicados, incluindo o
  secret com ao menos 32 caracteres. O erro não imprime seus valores.
- **Banco inacessível:** confirme `docker compose ps` e porta/credenciais; no host
  use `localhost`, dentro do Compose use `db`.
- **Coluna ausente:** aplique `db:migrate` e gere o cliente; reinicie a API.
- **Login inválido:** confirme que o usuário tem conta `credential`; só criar uma
  linha em `user` não cria uma senha.
- **Sessão perdida:** confira cookies, `credentials: include`, origem permitida,
  URL da API e se o secret mudou. `localhost` e `127.0.0.1` são hosts distintos.
- **403 no CRUD:** confira perfil `ADMIN` e `isActive=true`.
- **429 na demonstração:** aguarde a janela do rate limiter; ele guarda contadores
  em memória e não é distribuído entre várias instâncias.
