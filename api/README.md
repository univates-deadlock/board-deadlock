# API TechPro

API REST em Express 5, TypeScript, Zod, Prisma 7 e PostgreSQL. Autenticação e
sessão usam Better Auth. Leia primeiro o [README principal](../README.md).

## O que esta entrega implementa

- Login por email/senha, consulta da sessão e logout com cookie HTTP-only.
- Administração de usuários com os perfis `ADMIN`, `PLANNING` e `TECHNICIAN`.
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

Veja [o contrato completo e os exemplos curl](../docs/api-usuarios.md).

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

`DELETE` é exclusão lógica (`isActive=false`), mantendo referências dos registros
de negócio. Um usuário inativo continua visível ao administrador e pode ser
reativado. Não é permitido desativar a si mesmo, retirar o próprio perfil admin
ou remover o último administrador ativo.

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

Essa checagem executa lint, TypeScript e build. A entrega atual não tem suíte
automatizada; `npm test --prefix api` continua disponível para uma futura suíte,
mas não participa do CI ou de `check:api`. A verificação funcional desta entrega
foi feita por HTTP contra PostgreSQL separado, com dados fictícios.

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
