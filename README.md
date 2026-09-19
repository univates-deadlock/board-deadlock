<div align="center">

<img src="assets/images/common/techpro-logo.png" alt="TechPro" width="420">

<br>

# TechPro

![Status](https://img.shields.io/badge/status-Sprint%200-24345C?style=for-the-badge)
![Disciplina](https://img.shields.io/badge/Laboratório%20de%20Programação%20para%20Internet-2026B-24345C?style=for-the-badge)
[![GitHub Project](https://img.shields.io/badge/GitHub_Project-Acessar_Board-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/orgs/univates-deadlock/projects/2/views/1)

</div>

---

Projeto desenvolvido na disciplina de **Laboratório de Programação para Internet**, da Univates, durante o semestre **2026B**.

O projeto tem como cliente a **TechPro** e está atualmente na etapa de levantamento e descoberta do problema, antes da definição dos requisitos e da implementação da solução.

## Cliente

**TechPro**
Nesta etapa, o objetivo do grupo é entender como funciona a operação atual da empresa, identificar os principais problemas enfrentados no dia a dia e levantar informações que servirão de base para a definição do produto.

## Integrantes

- [**Alexandra Padilha**](https://github.com/alexandrapadilha1)
- [**Diogo Felipe Zanco**](https://github.com/DiogoFZanco)
- [**Mateus Carniel Brambilla**](https://github.com/matbdev)
- [**Tainá Luiza Schmidt**](https://github.com/TainaSchmidt)

## Projeto

O projeto está atualmente na **Sprint 0**, com foco na descoberta do problema e no levantamento inicial de informações que servirão de base para a definição do produto.

A entrevista com o cliente está prevista para **26 de agosto de 2026**.

## Documentação

A documentação da etapa de descoberta está organizada nos seguintes materiais:

### Contexto da TechPro: [`docs/contexto-cliente.md`](docs/contexto-cliente.md)

Reúne as informações que puderam ser identificadas previamente sobre a empresa a partir de materiais institucionais, presença pública e protótipos existentes.

### Perguntas para o cliente: [`docs/perguntas-cliente.md`](docs/perguntas-cliente.md)

Contém a hipótese inicial do problema, a ideia de caminho e o roteiro de perguntas preparado para a conversa com a TechPro.

## Protótipos da TechPro

Os protótipos utilizados como material de referência estão disponíveis no Figma:

- [Protótipo Desktop](https://www.figma.com/proto/luMSJDdrcew9JWRV0bKfvf/Site-TechPro?node-id=53-2&t=6ckapUM5hbwQRKYA-0&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=53%3A2)
- [Protótipo Mobile](https://www.figma.com/proto/luMSJDdrcew9JWRV0bKfvf/Site-TechPro?node-id=318-3&p=f&t=6ckapUM5hbwQRKYA-0&scaling=scale-down&content-scaling=fixed&page-id=318%3A2&starting-point-node-id=318%3A3)

## Board

A organização das atividades e o acompanhamento do projeto estão disponíveis no board:

[![GitHub Project](https://img.shields.io/badge/GitHub_Project-Acessar_Board-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/orgs/univates-deadlock/projects/2/views/1)

## Desenvolvimento local

Requisitos: Node.js 24, npm e Docker com Compose. O frontend Next.js fica em `frontend/`, a API Express/TypeScript em `api/` e o PostgreSQL é iniciado pelo Compose. Cada aplicação mantém seu próprio `package-lock.json`.

Para iniciar a aplicação completa:

```bash
docker compose up --build
```

O frontend fica em <http://localhost:3000>, a API em <http://localhost:4000> e a checagem da API em <http://localhost:4000/health>. O PostgreSQL fica disponível em `localhost:5432`. As portas são publicadas apenas em `127.0.0.1`. As credenciais locais padrão são `techpro`/`techpro` e podem ser alteradas com `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB` no ambiente do Compose. `POSTGRES_PORT`, `API_PORT` e `FRONTEND_PORT` alteram as portas publicadas no host. O Compose usa `db` como hostname do banco dentro dos containers; no host, a URL usa `localhost`.

Para desenvolver com Node no host e apenas o banco no Docker:

```bash
docker compose up -d db
cp api/.env.example api/.env
npm run install:all
npm run dev --prefix api
npm run dev --prefix frontend
```

Os dois últimos comandos rodam em terminais separados. `api/.env` contém `PORT` e `DATABASE_URL`; o exemplo usa somente credenciais de desenvolvimento. Não salve credenciais reais no repositório. No Compose, dependências, cliente Prisma gerado e cache do Next.js ficam em volumes próprios para não alterar a propriedade desses arquivos no host. `docker compose down` para os serviços e preserva os dados no volume do PostgreSQL.

Para executar as checagens locais depois de instalar as dependências:

```bash
npm run check
npm run db:validate --prefix api
npm run db:generate --prefix api
```

O CI executa lint, verificação de tipos, testes e build da API, além de lint, tipos e build do frontend. A API inclui um teste inicial do endpoint `/health` e da configuração de ambiente. O Prisma 7 e seu adaptador PostgreSQL estão instalados; o schema ainda não contém modelos de negócio nem migrations. Eles serão adicionados quando a persistência das funcionalidades for implementada. `axios` já está instalado no frontend para futuras chamadas à API.

---

<div align="center">

**Laboratório de Programação para Internet · Univates · 2026B**

</div>
