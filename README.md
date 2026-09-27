<div align="center">

<img src="assets/images/common/techpro-logo.png" alt="TechPro" width="420">

# TechPro

Sistema interno para organizar o fluxo cliente → orçamento → serviço → visita.
Projeto da disciplina de Laboratório de Programação para Internet da Univates.

</div>

## Estado atual e Parcial 1

Esta entrega implementa **autenticação/sessão e administração de usuários na API**.
O usuário possui perfil `ADMIN`, `PLANNING` ou `TECHNICIAN`. Administradores podem
cadastrar usuários com senha, consultar, editar, ativar e desativar. O login usa
email e senha; sessões são persistidas no PostgreSQL e transportadas por cookies.

O schema já possui outras entidades do produto, mas seus CRUDs ainda precisam ser
implementados pelos responsáveis. A página atual do frontend é a inicial do
Next.js; a página institucional conforme o Figma e o segundo CRUD são outras
tarefas da equipe. Não confunda o schema completo com endpoints já entregues.

Critérios informados para a Parcial 1:

| Critério | Pontos | Evidência para apresentar |
| --- | --- | --- |
| Autenticação e sessão | 2,5 | login, consulta da sessão e logout |
| Dois CRUDs | 3,0 | fluxos de cadastro, consulta, edição e exclusão |
| Site minimamente funcional | 2,0 | página institucional conforme Figma |
| README de execução | 0,5 | instalação e execução reproduzíveis |
| Processo e robustez | 2,0 | divisão de tarefas, Git, validação e erros |

Testes automatizados foram retirados do escopo desta entrega. A API foi verificada
funcionalmente por HTTP com PostgreSQL separado e dados fictícios. O CI e
`npm run check` executam lint, tipos e build, sem exigir suíte de testes.

## Equipe e referências

- [Alexandra Padilha](https://github.com/alexandrapadilha1)
- [Diogo Felipe Zanco](https://github.com/DiogoFZanco)
- [Mateus Carniel Brambilla](https://github.com/matbdev)
- [Tainá Luiza Schmidt](https://github.com/TainaSchmidt)

A divisão nominal das tarefas deve refletir o combinado real no
[board do GitHub](https://github.com/orgs/univates-deadlock/projects/2/views/1).
Nos slides, associem cada entrega ao nome de quem a implementou.

- [Figma Desktop](https://www.figma.com/proto/luMSJDdrcew9JWRV0bKfvf/Site-TechPro?node-id=53-2&t=6ckapUM5hbwQRKYA-0&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=53%3A2)
- [Figma Mobile](https://www.figma.com/proto/luMSJDdrcew9JWRV0bKfvf/Site-TechPro?node-id=318-3&p=f&t=6ckapUM5hbwQRKYA-0&scaling=scale-down&content-scaling=fixed&page-id=318%3A3&starting-point-node-id=318%3A3)

## Estrutura

```text
api/          Express, TypeScript, Zod, Prisma, autenticação e usuários
frontend/     Next.js App Router, React e Tailwind
assets/       logo e imagens dos documentos
docs/        requisitos, contexto e contrato da API
.github/      checagens no GitHub Actions
```

A API e o frontend possuem `package.json` e lockfile próprios. Instale uma
dependência na aplicação que a utiliza, por exemplo `npm install pacote --prefix api`.
O Prisma pertence a `api/`; não execute `prisma init` na raiz.
Uma pasta local `api/frontend/` não é a aplicação oficial e não é usada pelos
comandos abaixo; os arquivos preexistentes nela foram preservados.

## Requisitos

- Node.js **24**, com npm.
- Docker com plugin Compose, daemon ativo e acesso liberado ao usuário local.
- Portas locais 3000 (frontend), 4000 (API) e 5432 (PostgreSQL) disponíveis.

## Primeiro acesso: configurar o ambiente

Clone o repositório, entre na raiz e instale as dependências:

```bash
npm run install:all
```

Se ainda não existe `api/.env`, crie-o a partir de `api/.env.example`.

```bash
if [ ! -f api/.env ]; then
  cp api/.env.example api/.env
fi
```
 Preserve um
arquivo existente. Preencha `BETTER_AUTH_SECRET` com um valor aleatório de pelo
menos 32 caracteres; o [README da API](api/README.md#instalar-e-configurar) contém
um comando que gera e grava o secret sem exibi-lo. O arquivo deve conter:

| Variável | Desenvolvimento local |
| --- | --- |
| `PORT` | `4000` |
| `DATABASE_URL` | `postgresql://techpro:techpro@localhost:5432/techpro` |
| `BETTER_AUTH_URL` | `http://localhost:4000` |
| `FE_BASE_URL` | `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | secret local aleatório |

São credenciais locais de desenvolvimento. O `.env` é ignorado pelo Git e não
deve conter valores reais compartilhados em commits, slides ou prints.

## Opção A — stack completa no Docker

Após configurar `api/.env`:

```bash
docker compose up --build
```

O PostgreSQL é iniciado primeiro; a API gera o cliente Prisma, aplica migrations
e inicia o servidor. O frontend inicia em seguida. Para criar o primeiro
administrador, abra outro terminal e siga
[este procedimento](api/README.md#criar-o-primeiro-administrador), usando a variante
`docker compose exec` indicada no guia. Depois faça login usando esse cadastro.

| Serviço | Endereço no host |
| --- | --- |
| Frontend | http://localhost:3000 |
| API | http://localhost:4000 |
| Health HTTP | http://localhost:4000/api/health |
| PostgreSQL | localhost:5432 |

Dentro do Compose, a API usa `db:5432`; no host, a URL do banco usa `localhost`.
As portas são publicadas em `127.0.0.1`. Dependências, cliente Prisma e cache do
Next.js usam volumes próprios, evitando alterações de propriedade no host.

```bash
docker compose ps
docker compose logs -f api
docker compose down
```

`down` preserva o volume do banco. Não adicione `-v` se quiser manter seus dados.
As variáveis `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`,
`API_PORT` e `FRONTEND_PORT` permitem ajustar o Compose. Ao trocar portas/hosts,
ajuste também as URLs do ambiente e a origem permitida.

## Opção B — Node no host e banco no Docker

```bash
docker compose up -d db
npm run db:validate --prefix api
npm run db:generate --prefix api
npm run db:migrate --prefix api
```

Crie o primeiro administrador seguindo o
[guia da API](api/README.md#criar-o-primeiro-administrador). Depois, em terminais
separados:

```bash
npm run dev --prefix api
```

```bash
npm run dev --prefix frontend
```

O cliente do frontend usa `NEXT_PUBLIC_API_URL`, com fallback para
`http://localhost:4000`. Para outra URL, configure `frontend/.env.local` e reinicie
o Next.js. Veja [frontend/README.md](frontend/README.md).

## Como entender a implementação

Um cadastro percorre:

```text
requisição POST /api/users
→ middleware de sessão: quem está chamando?
→ middleware de perfil: essa pessoa é ADMIN?
→ controller: o JSON e os parâmetros são válidos?
→ service: aplicar regras, hash e transação
→ Prisma/PostgreSQL: persistir usuário e credencial
→ resposta 201 com campos públicos
```

Login/logout são atendidos pelo Better Auth. O CRUD usa rotas, controllers,
schemas e services próprios. A senha nunca aparece na resposta do CRUD.
`DELETE /api/users/:id` desativa em vez de apagar, preservando os vínculos de
negócio. Confirme com o professor a aceitação da exclusão lógica na rubrica.

Leitura recomendada:

1. [Guia da API](api/README.md): instalação, autenticação e arquitetura.
2. [Contrato e demonstração](docs/api-usuarios.md): requests completos com curl.
3. READMEs em `api/src/`: responsabilidade de cada camada e padrão para os colegas.
4. [Prisma](api/prisma/README.md): modelos e migrations.
5. [Requisitos](docs/documento-requisitos.md): produto esperado e regras.

## Checagens e processo de trabalho

```bash
npm run check
```

Ou separadamente:

```bash
npm run check:api
npm run check:frontend
npm run db:validate --prefix api
npm run db:generate --prefix api
```

`check` executa lint, verificação TypeScript e build de ambas as aplicações.
`npm test --prefix api` permanece como comando para uma futura suíte; hoje não há
arquivos de teste e ele não integra a checagem da Parcial 1. Builds do frontend
podem precisar de rede para baixar as fontes configuradas em `next/font/google`.

Para uma tarefa: alinhe o escopo no board, trabalhe em uma branch, faça commits
com alterações relacionadas, confira a execução/checagens e abra PR para revisão
da equipe. A apresentação deve mostrar histórico e branches reais; este trabalho
não criou commits ou publicou alterações automaticamente.

## Preparar a apresentação

Os grupos terão dez minutos de apresentação e o professor cinco minutos.
Montem slides com:

- divisão nominal de tarefas;
- prints/GIFs/vídeo do frontend;
- fluxo de login, sessão e logout;
- os dois CRUDs, incluindo erros e validação;
- histórico de commits e branches do GitHub;
- dificuldades, decisões e aprendizados.

Todos devem entender a parte que implementaram, mesmo quem não apresentar.
Use dados fictícios e o roteiro de [API de usuários](docs/api-usuarios.md).

## Documentação do produto

- [Índice da documentação](docs/README.md)
- [Contexto do cliente](docs/contexto-cliente.md)
- [Perguntas ao cliente](docs/perguntas-cliente.md)
- [Documento de requisitos](docs/documento-requisitos.md)

O sistema existente de estoque/OS permanece separado. Não há integração
automática nesta entrega.
