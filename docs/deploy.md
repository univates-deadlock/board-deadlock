# Deploy — TechPro App na VM da Univates

O CI do `techpro-app` executa lint, tipos e build. O CD da VM utiliza o repositório
**privado** `univates-deadlock/deadlock-deploy`, que tem um GitHub Actions
self-hosted runner instalado na VM. O runner recebe trabalhos via HTTPS; o deploy
não depende de uma conexão SSH de entrada dos runners hospedados no GitHub.

O deploy manual é executado em **deadlock-deploy → Actions → Deploy Deadlock**,
com o alvo `app`. A automação após CI aprovado na `main` depende da integração
`Notify central CD` (PR #45); não confunda CI verde com deploy realizado.
O workflow SSH antigo em `.github/workflows/deploy.yml` deve ficar desativado
após validação do CD central.

## Dois arquivos de ambiente — ambos NÃO versionados

O Docker Compose (`docker-compose.yml`) espera estes arquivos **na VM**, no
checkout do projeto:

- `~/techpro-app/.env`: configura Compose, PostgreSQL, portas e URLs públicas.
- `~/techpro-app/api/.env`: é lido pelo `env_file` do serviço `api` e contém
  `BETTER_AUTH_SECRET`. Não é necessário duplicar nele as variáveis que o Compose
  já fornece ao container.

Os arquivos `.env.example` são modelos públicos e versionados. **Um commit
contendo `.env.example` não cria nem atualiza o `.env` real na VM.** Ambos os
arquivos `.env` reais estão cobertos por `.gitignore`. Não envie secrets,
senhas de banco ou conteúdo de `.env` para PRs, logs, issues ou capturas de tela.

Para a VM com o domínio `app.matbdev.com`, o `.env` da raiz deve conter ao menos
as entradas abaixo, além dos parâmetros de PostgreSQL existentes:

```dotenv
# Manter os valores ATUAIS do banco; não modificar dados de um volume existente.
POSTGRES_USER=techpro
POSTGRES_PASSWORD=<senha-atual-do-banco>
POSTGRES_DB=techpro

APP_HOST=app.matbdev.com
API_PORT=4000
FRONTEND_PORT=3000
API_BIND_IP=127.0.0.1
FRONTEND_BIND_IP=127.0.0.1
BETTER_AUTH_URL=https://app.matbdev.com
FE_BASE_URL=https://app.matbdev.com
NEXT_PUBLIC_API_URL=https://app.matbdev.com
```

O `api/.env` mínimo para execução via Docker Compose é:

```dotenv
BETTER_AUTH_SECRET=<mesma-chave-já-utilizada-no-ambiente>
```

**Migração de um único `.env` existente:** copie o valor atual de
`BETTER_AUTH_SECRET` da raiz para `api/.env` antes de removê-lo da raiz.
Não gere outro segredo, pois isso pode invalidar as sessões. Guarde backups
fora do repositório e atribua permissões restritas (`chmod 600`) aos arquivos.

O Compose define `PORT`, `DATABASE_URL`, `BETTER_AUTH_URL` e `FE_BASE_URL`
diretamente no serviço `api`, prevalecendo sobre entradas de mesmo nome
vindas de `api/.env`. Para executar a API fora do Compose, consulte o
`api/.env.example` e [README da API](../api/README.md).

## Publicação HTTPS

O Caddy central, gerenciado pelo `deadlock-deploy`, expõe
`https://app.matbdev.com`: requisições `/api/*` vão para o alias Docker
`techpro-api:4000`, e as demais para `techpro-frontend:3000`. As duas aplicações
participam da rede externa Docker `deadlock_edge` (criada pela infraestrutura).
Não publique as portas 3000 e 4000 diretamente na Internet. O DNS `A` de `app`
deve apontar para o IPv4 público da VM.

O banco PostgreSQL continua em volume Docker persistente e sua porta no host
fica ligada a `127.0.0.1`. Nunca execute `docker compose down -v` para aplicar
configuração, pois isso remove volumes persistentes, inclusive o do banco.

## Validação e operação

Na VM, **depois de configurar ambos os arquivos reais**:

```bash
cd ~/techpro-app
sudo docker compose config --quiet
```

No repositório privado `deadlock-deploy`, execute `Deploy Deadlock` com o
alvo `app`. O procedimento faz checkout da versão `main`, atualiza os serviços
e verifica disponibilidade das aplicações. Para validar os endpoints públicos:

```bash
curl -fsS https://app.matbdev.com/api/health
curl -sS -o /dev/null -w '%{http_code}\n' https://app.matbdev.com/login
```

O health da API deve retornar JSON com `status: "ok"` e `/login` deve retornar
HTTP 200. Teste também login, sessão e operações CRUD com conta de demonstração:
health checks isolados não comprovam a autenticação.

Se o acesso interativo SSH à VM estiver indisponível, atualizar os modelos no
GitHub **não é suficiente**. Os `.env` reais precisam ser preparados por um
operador com acesso à VM ou por uma ação manual segura do runner
self-hosted no repositório privado de deploy. Não armazene os valores reais
no repositório Git, público ou privado.

## Limitações atuais

Os Dockerfiles atuais executam os servidores de desenvolvimento (`next dev`
e `tsx watch`) com volumes de código. A publicação destina-se a demonstração
acadêmica. Antes de uso efetivo em produção, migrar para builds de produção,
remover as credenciais padrão e rever segurança, backup e monitoramento.

## Copilot

`.github/copilot-instructions.md` contém as instruções gerais e de revisão;
`.github/instructions/` adiciona regras por caminho para API e frontend.
`.github/skills/` contém as skills locais e referências para o Copilot.
