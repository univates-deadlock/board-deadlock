# Validação para demonstração — 30/09/2026

A stack local foi iniciada com PostgreSQL 17, API e frontend no Docker, com
Node.js 24.21.0. O endereço da aplicação é **http://localhost:3000**; a API
responde em **http://localhost:4000/api/health**. Use `localhost` em ambas as URLs
para compartilhar o cookie de sessão. As portas estão publicadas somente no host
local; acesso por outro computador não foi configurado.

## O que pode ser demonstrado

| Área | Resultado |
| --- | --- |
| Login, sessão e logout | Funcionam com conta interna provisionada |
| Usuários | ADMIN cadastra, lista, edita, desativa e reativa |
| Clientes | ADMIN e PLANNING cadastram, listam, buscam, editam, desativam e reativam |
| Permissões | Backend recusa operações não autorizadas com 401/403 |
| Dashboard | Página de apresentação; sem indicadores operacionais |
| Orçamentos, serviços, garantias e revisões | Páginas de “em desenvolvimento”; sem CRUD |
| Página institucional | Não entregue pelo frontend Next.js atual |

Não é a entrega completa do documento de requisitos. Clientes ainda têm um
contato e um local no cadastro básico; múltiplos contatos/locais não estão
implementados. Não há recuperação ou alteração de senha pela tela administrativa.

## Correções feitas durante a validação

- Desenvolvimento com Webpack: Turbopack retornava 500 ao resolver o Tailwind no
  Docker; a mesma página respondeu 200 com Webpack.
- URLs padrão dos CRUDs alinhadas ao login em `localhost`, evitando divergência
  de host do cookie quando `NEXT_PUBLIC_API_URL` não está configurada.
- Busca por nome de cliente deixa de incluir todos os registros quando o termo
  não contém números. Documentos também são comparados sem máscara.
- Logout só redireciona após sucesso; falhas informam que a sessão continua ativa
  e permitem tentar novamente.
- Formulários usam diálogo nativo com nome acessível, foco, Escape, retorno do
  foco e rolagem interna. Fechamento fica bloqueado durante o envio.
- Menu mobile pode ser fechado por teclado; links ocultos não recebem foco e
  mudar para desktop encerra o menu e a contenção de foco.
- Erros dos CRUDs mostram detalhes de validação enviados pela API. A orientação
  incorreta de recriar usuário para trocar a senha foi removida.

## Verificação executada

- `npm run check`, em container Node.js 24 com os volumes de dependências:
  lint, TypeScript e build da API e do frontend aprovados.
- `npm run db:validate` na API: schema válido. Startup aplicou as migrations
  versionadas, sem reset do banco.
- 43 verificações HTTP em API temporária na porta 4400 e banco separado
  `techpro_validation_20260930`, com contas e clientes fictícios: login válido e
  inválido, 401/403, cadastro/consulta/edição, duplicidade 409, campos inválidos
  400, registro ausente 404, exclusão lógica, ativação, autodesativação bloqueada,
  revogação na desativação e alteração de perfil, login inativo recusado, rotas
  nativas de edição/exclusão bloqueadas e logout. Efeitos persistidos conferidos.
- Chrome instalado (148.0.7778.167), com perfil temporário: login; criação,
  edição, desativação e reativação dos dois CRUDs; busca por nome; validação de
  formulário; foco/Escape; menu mobile e mudança para desktop; logout com falha
  de rede simulada e nova tentativa; redirecionamento sem sessão.
- Telas de clientes e usuários em 360, 768 e 1280 px: sem overflow horizontal
  da página. Tabelas têm rolagem horizontal dentro de seu contêiner no celular;
  o formulário longo tem rolagem vertical dentro do diálogo.

O erro de rede capturado no último cenário de navegador foi provocado
deliberadamente para validar o logout. Não foi criada nem executada uma suíte
automatizada permanente, conforme o escopo da Parcial 1. Não foram verificados
deploy de produção, carga concorrente, outros navegadores ou conformidade visual
com o Figma. Há refinamentos de contraste na paleta atual que ainda merecem uma
revisão de acessibilidade; a validação funcional não certifica conformidade WCAG.

## Roteiro para apresentar

1. Abrir `http://localhost:3000` e entrar com o administrador fictício.
2. Em Clientes, cadastrar um registro, buscar pelo nome, editar e desativar/reativar.
3. Em Usuários, cadastrar PLANNING ou TECHNICIAN, editar e desativar/reativar.
4. Mostrar validação de campos e conflito de email duplicado.
5. Sair e acessar uma rota interna, mostrando o retorno ao login.
6. Explicar que os outros módulos aguardam implementação; não apresentá-los
   como operações prontas.

A conta `admin.demo@example.com` e dois clientes fictícios ficaram no banco local
para a demonstração. A senha foi gravada somente no arquivo privado local
`/tmp/techpro-demo-access.txt`; ela não está versionada. O arquivo em `/tmp` pode
ser removido pelo sistema entre reinicializações: guarde as credenciais localmente
antes disso. O provisionamento não sobrescreveu contas existentes, e `api/.env`
foi criado com secret aleatório sem exibição no terminal.

Para iniciar novamente, com o ambiente já configurado:

```bash
docker compose up -d --build
docker compose ps
```

`docker compose down` para a stack e preserva o banco. Não use `down -v` para
preparar a apresentação. As instruções completas estão no README principal.
