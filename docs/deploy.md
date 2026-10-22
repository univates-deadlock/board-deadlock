# Deploy automático na VM

O fluxo em `.github/workflows/deploy.yml` segue o modelo SSH + Docker Compose do
repositório `techpro-web-landing-page`, adaptado à API, frontend e PostgreSQL.
Depois de um push na `main`, o workflow **CI** precisa concluir com sucesso nas
duas aplicações. Só então **Deploy TechPro** conecta à VM. Pull requests e outras
branches não fazem deploy. O workflow precisa estar na branch padrão (`main`).

Não há pausa fixa de 60 segundos nem etapa de captura de tráfego. O Compose usa
healthchecks e `up --wait --wait-timeout 180`: prossegue assim que os serviços
estiverem saudáveis e falha se o prazo acabar. Esse prazo conta após o build;
o job completo tem limite de 20 minutos. Os serviços reiniciam com o Docker,
exceto quando foram parados explicitamente (`unless-stopped`).

## Preparação única da VM

Use Bash, Git, Docker Engine ativo e Docker Compose v2.24.0 ou superior, com
suporte a `up --wait` e ao [`env_file.required`](https://docs.docker.com/reference/compose-file/services/#required)
utilizado pelo projeto. O usuário SSH precisa executar `sudo -n docker compose`
sem prompt e acessar o repositório pelo `origin`, inclusive em operações Git sem
interação. A chave runner → VM não substitui a credencial VM → GitHub.

1. Clone este repositório em **`$HOME/board-deadlock`**, no home do usuário SSH,
   e mantenha o clone na branch `main`, sem alterações locais rastreadas.
2. Na raiz desse clone, crie `.env` a partir de `.env.example` e configure
   `APP_HOST` com o IP ou hostname acessível da VM. Ajuste portas e credenciais
   do PostgreSQL conforme necessário, antes da primeira criação do volume.
   As credenciais do Compose precisam corresponder às do banco já existente.
3. Configure `api/.env` conforme [o README](../README.md#primeiro-acesso-configurar-o-ambiente),
   incluindo um `BETTER_AUTH_SECRET` aleatório de pelo menos 32 caracteres.
   Preserve esse valor entre deploys. URLs públicas da API/frontend são derivadas
   de `APP_HOST` e das portas no `.env` da raiz; configure URLs explícitas ali
   se usar HTTPS ou proxy. Não use `localhost` como endereço público remoto.
4. Libere na rede as portas de acesso ao frontend e à API (3000 e 4000 por
   padrão). O PostgreSQL permanece restrito ao loopback da VM.
5. Faça o primeiro startup com `sudo -n docker compose up -d --build --wait
   --wait-timeout 180` e provisione o primeiro administrador seguindo
   [o guia da API](../api/README.md#criar-o-primeiro-administrador).

Os arquivos `.env` não são enviados pelo Actions nem substituídos pelo deploy.
O banco permanece no volume `postgres_data`. Migrations versionadas são aplicadas
no startup da API; o deploy não reseta o banco nem remove volumes. A criação do
administrador continua sendo uma operação manual única.

Este fluxo utiliza o Compose atual, com bind mounts e servidores de
desenvolvimento (`tsx watch` e `next dev`), para a VM de demonstração da disciplina.
Não introduz uma stack de produção, proxy ou TLS. Os healthchecks verificam o
PostgreSQL com `pg_isready`, a API em `/api/health` e o frontend em `/login`;
eles não validam login, permissões ou CRUDs. O health HTTP da API não consulta o
banco, embora o startup aplique migrations antes de iniciar o servidor.

## Secrets do GitHub Actions

Cadastre em **Settings → Secrets and variables → Actions** deste repositório:

| Secret | Valor |
| --- | --- |
| `VM_HOST` | IP ou hostname da VM, sem protocolo ou porta |
| `VM_USER` | Usuário SSH cujo home contém `board-deadlock` |
| `VM_PORT` | Porta SSH; opcional, padrão `22` |
| `VM_SSH_KEY` | Chave privada sem passphrase usada pelo runner para conectar à VM |
| `VM_KNOWN_HOSTS` | Entrada da chave pública SSH do host, verificada por um canal confiável |

Para porta diferente de 22, a entrada em `VM_KNOWN_HOSTS` deve usar
`[host]:porta`. A chave pública correspondente a `VM_SSH_KEY` deve estar em
`authorized_keys` do usuário da VM. O workflow valida chave, porta e entrada do
host; usa autenticação não interativa e `StrictHostKeyChecking=yes`.

## Atualização e falhas

O script `.github/scripts/deploy.sh` faz `git fetch origin main` e avança o clone
com `git merge --ff-only` até o SHA aprovado pelo CI. Ele recusa branch diferente
de `main`, alterações locais rastreadas e histórico divergente. Se o commit já
não for a ponta de `origin/main`, encerra sem deploy para não publicar uma versão
antiga. Os deploys são serializados e uma execução em andamento não é cancelada.

Em falha, o job retorna erro e mostra estado e últimos logs da API/frontend.
Revise os logs no Actions e na VM, corrija a causa e use **Re-run all jobs** no
workflow CI do push da `main` para disparar novamente o deploy. Se houver commit
mais novo na `main`, use a execução desse commit. Não há rollback automático;
uma migração aplicada não é desfeita por falha de saúde do frontend.

## Copilot

`.github/copilot-instructions.md` contém as instruções gerais e de revisão;
`.github/instructions/` adiciona regras por caminho para API e frontend.
`.github/skills/` contém cópias completas das duas skills locais, incluindo suas
referências, para uso pelo Copilot e pelo code review no GitHub. Mantenha-as
sincronizadas com `.agents/skills/` e `.claude/skills/`.

O suporte a essas skills segue a
[documentação do GitHub](https://docs.github.com/en/enterprise-cloud%40latest/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills).
Os arquivos orientam o Copilot; a solicitação automática de revisão depende das
configurações e da disponibilidade do Copilot no repositório/organização.
