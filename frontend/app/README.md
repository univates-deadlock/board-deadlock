# Páginas do App Router (`frontend/app`)

Estrutura de rotas da aplicação Next.js:

- `layout.tsx` e `globals.css`: layout raiz em `pt-BR`, carregamento da fonte `Rubik` e tokens visuais compartilhados com a identidade da TechPro.
- `login/page.tsx`: tela pública de autenticação por e-mail e senha.
- `(protected)/layout.tsx`: layout servidor que executa `requireActiveSession()` antes de renderizar o `AppShell`, redirecionando visitantes sem sessão ativa para `/login`.
- `(protected)/page.tsx`: painel inicial ("Visão geral") com indicadores e listagem de orçamentos em aberto derivados de `GET /api/quotes`.
- `(protected)/usuarios/page.tsx`: gerenciamento de usuários (`ADMIN`).
- `(protected)/clientes/page.tsx`: gerenciamento de clientes (`ADMIN` e `PLANNING`).
- `(protected)/orcamentos/page.tsx` e `(protected)/orcamentos/[id]/page.tsx`: listagem, criação, edição, exclusão de rascunhos e visualização detalhada de orçamentos (`ADMIN` e `PLANNING`).
- `(protected)/servicos/page.tsx`, `(protected)/garantias/page.tsx` e `(protected)/revisoes/page.tsx`: páginas `DevPage` ("Em desenvolvimento") reservadas para as próximas etapas.

Mantenha Server Components como padrão em layouts e páginas de entrada, delegando interatividade de formulários, modais e filtros aos Client Components em `frontend/components/`. Os contratos de requisição e resposta estão documentados em [`api/README.md`](../../api/README.md).
