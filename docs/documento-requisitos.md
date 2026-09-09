# TechPro — Documento de Requisitos

**Universidade do Vale do Taquari — Univates**  
**Disciplina:** Laboratório de Programação para Internet  
**Professor:** Mateus Roveda  
**Local:** Lajeado, Rio Grande do Sul  
**Data:** setembro de 2026

## Integrantes

- Alexandra Padilha
- Diogo Felipe Zanco
- Mateus Carniel Brambilla
- Taina Luiza Schmidt

---

## Sumário

1. [Visão Geral](#1-visão-geral)
   - [1.1 Fronteira do produto](#11-fronteira-do-produto)
2. [Problema](#2-problema)
3. [Solução Proposta](#3-solução-proposta)
4. [Objetivos e Critérios de Sucesso](#4-objetivos-e-critérios-de-sucesso)
5. [Escopo](#5-escopo)
   - [5.1 MVP obrigatório](#51-mvp-obrigatório)
   - [5.2 Opcional / stretch do MVP](#52-opcional--stretch-do-mvp)
   - [5.3 Evoluções futuras — fora do MVP](#53-evoluções-futuras--fora-do-mvp)
6. [Usuários e Atores](#6-usuários-e-atores)
7. [Requisitos Funcionais](#7-requisitos-funcionais)
8. [Requisitos Não Funcionais](#8-requisitos-não-funcionais)
9. [Histórias de Usuário](#9-histórias-de-usuário)
10. [Casos de Uso](#10-casos-de-uso)
    - [10.1 Diagrama geral](#101-diagrama-geral)
    - [10.2 Catálogo e rastreabilidade](#102-catálogo-e-rastreabilidade)
    - [10.3 Casos de uso detalhados com regras de negócio](#103-casos-de-uso-detalhados-com-regras-de-negócio)
11. [Modelo de Banco de Dados](#11-modelo-de-banco-de-dados)
    - [11.1 Entidades principais](#111-entidades-principais)
12. [Decisões de Implementação](#12-decisões-de-implementação)
    - [12.1 Decisões Gerais](#121-decisões-gerais)
    - [12.2 Decisões de Teste](#122-decisões-de-teste)
13. [Fora de Escopo e Itens Opcionais](#13-fora-de-escopo-e-itens-opcionais)
    - [13.1 Opcional para o MVP](#131-opcional-para-o-mvp)
    - [13.2 Fora do MVP](#132-fora-do-mvp)
14. [Glossário](#14-glossário)

---

# 1. Visão Geral

Este documento de requisitos descreve o sistema interno proposto para a TechPro. O documento consolida o levantamento realizado com o cliente e define problema, solução, escopo, requisitos, histórias de usuário, casos de uso, modelo de dados, decisões de implementação e teste, itens opcionais e evoluções futuras.

## 1.1 Fronteira do produto

O novo sistema não substitui o software atualmente utilizado pela TechPro para estoque e ordens de serviço.

No MVP, a OS oficial e o estoque continuam no software existente; o novo sistema centraliza o ciclo comercial, planejamento, agenda, acompanhamento gerencial e pós-serviço.

---

# 2. Problema

A operação da TechPro possui informações relevantes distribuídas entre WhatsApp, ligações, visitas, agenda, planilhas e um software já utilizado para estoque e ordens de serviço.

Essa fragmentação gera três perdas concretas:

- A equipe de planejamento não tem uma visão única do histórico: quais propostas já foram enviadas, qual foi aprovada e o que ficou combinado.
- O histórico de orçamentos e serviços do cliente não está centralizado, dificultando consultar propostas anteriores e decisões comerciais.
- Depois que um serviço é aprovado, agendar visita e atribuir técnicos depende de agenda paralela e comunicação manual, sem vínculo formal com a proposta que originou o serviço.

A OS oficial e o controle de estoque continuam no software já usado pela TechPro; este sistema não substitui esse software, ele organiza o que acontece antes e ao redor dele.

---

# 3. Solução Proposta

Uma aplicação web interna que cobre o ciclo:

**cliente → orçamento → serviço/visita**

A aplicação contempla:

- cadastro de clientes com seus contatos e locais de atendimento;
- orçamentos com itens e registro de decisão, mantendo histórico dos orçamentos associados ao cliente;
- registro da decisão do orçamento como aprovado, rejeitado ou expirado;
- serviços que nascem de um orçamento aprovado ou são abertos diretamente;
- execução agendada com técnicos atribuídos.

O acesso é interno e depende de autenticação, com funcionalidades restringidas por perfil.

---

# 4. Objetivos e Critérios de Sucesso

- Centralizar em uma única aplicação o histórico comercial e de planejamento de cada cliente.
- Manter histórico dos orçamentos e serviços associados a cada cliente e registrar o resultado de cada orçamento.
- Permitir que um serviço originado de orçamento aprovado ou criado diretamente tenha sua execução agendada e técnicos atribuídos.
- Reduzir dependência de planilhas para acompanhamento de orçamento, agenda, garantias e revisões.

---

# 5. Escopo

## 5.1 MVP obrigatório

- Autenticação e perfis de acesso: gestor, orçamento/planejamento e técnico.
- Cadastro de clientes, contatos e local de atendimento.
- Orçamentos com itens de produto/serviço/outro, totais e status.
- Criação de serviço a partir de orçamento aprovado ou diretamente para manutenção, revisão, garantia ou outro motivo.
- Agendamento da execução de serviços com atribuição de técnicos.
- Referência manual à OS mantida no software existente.
- Registro gerencial de visita e conclusão, sem substituir a OS oficial.
- Garantias de serviço e de fabricante separadas.
- Revisões programadas e alertas internos.
- Dashboard operacional básico e busca/filtros.

## 5.2 Opcional / stretch do MVP

- Visões adicionais no dashboard para funil comercial e indicadores, desde que não comprometam requisitos obrigatórios.

## 5.3 Evoluções futuras — fora do MVP

- Versionamento imutável de orçamentos, preservando histórico de versões de propostas.
- Automação de orçamento, sujeita a reavaliação com o cliente.
- Pesquisa automática de preços e integração com catálogos/fornecedores.
- Integração com o software atual para sincronizar OS, produtos e estoque.
- Envio automático de notificações por WhatsApp ou e-mail.
- Portal externo para clientes acompanharem orçamento, serviço, garantia ou revisão.
- Substituição do controle de estoque ou da OS oficial.
- Registro de vendas de produtos realizadas por técnicos, vinculadas ao cliente e opcionalmente ao serviço, sem movimentação de estoque no novo sistema.
- Busca automatizada de licitações, com identificação de oportunidades relevantes para a TechPro.

---

# 6. Usuários e Atores

| Ator                         | Contexto                                                                      | Principais permissões                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Gestor / Administrador**   | Responsável com atuação transversal entre comercial, planejamento e execução. | Acesso completo; usuários; clientes; orçamentos; planejamento; garantias; revisões; dashboard.          |
| **Orçamento / Planejamento** | Duas pessoas fixas responsáveis pela parte comercial e planejamento.          | Clientes; orçamentos; aprovação; serviços; visitas; técnicos; OS externa; garantias; revisões; alertas. |
| **Técnico**                  | Duas pessoas fixas de instalação e um técnico variável quando necessário.     | Agenda e serviços atribuídos; dados necessários do cliente; informações da visita.                      |

---

# 7. Requisitos Funcionais

| ID       | Requisito verificável                                                                                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RF01** | O sistema deve exigir autenticação para qualquer funcionalidade interna.                                                                                                                    |
| **RF02** | O administrador deve poder criar, editar, ativar e desativar usuários internos.                                                                                                             |
| **RF03** | O sistema deve restringir funcionalidades conforme os perfis `ADMIN`, `PLANNING` e `TECHNICIAN`.                                                                                            |
| **RF04** | Usuários autorizados (`ADMIN`, `PLANNING`) devem poder cadastrar, editar, consultar e inativar clientes pessoa física ou jurídica.                                                          |
| **RF05** | O sistema deve permitir associar zero ou mais contatos a cada cliente, podendo indicar um contato principal.                                                                                |
| **RF06** | O sistema deve permitir associar zero ou mais locais de atendimento a cada cliente.                                                                                                         |
| **RF07** | Cada orçamento deve aceitar vários itens dos tipos `PRODUTO`, `SERVICO` ou `OUTRO`, com descrição, quantidade, valor unitário e desconto.                                                   |
| **RF08** | O sistema deve recalcular o valor total do orçamento a partir dos itens e descontos registrados.                                                                                            |
| **RF09** | Ao aprovar um orçamento, o sistema deve permitir criar o serviço/agendamento correspondente, reaproveitando os dados do cliente e as informações relevantes do orçamento.                   |
| **RF10** | O sistema deve permitir registrar aprovação, rejeição ou expiração de um orçamento, com data, observação e evidência opcional.                                                              |
| **RF11** | O sistema deve permitir criar serviço a partir de orçamento aprovado ou diretamente para um cliente.                                                                                        |
| **RF12** | O serviço deve registrar sua origem entre `ORÇAMENTO`, `MANUTENÇÃO`, `REVISÃO`, `GARANTIA` ou `OUTRO`.                                                                                      |
| **RF13** | Um serviço deve permitir armazenar referência opcional ao número da OS existente no software atual.                                                                                         |
| **RF14** | O sistema deve permitir agendar a execução de um serviço, informando data/horário, status, local e observações.                                                                             |
| **RF15** | Cada visita deve permitir atribuir um ou mais técnicos.                                                                                                                                     |
| **RF16** | Técnicos devem visualizar sua agenda e os serviços/visitas aos quais estão atribuídos.                                                                                                      |
| **RF17** | Técnicos devem poder registrar início/fim real, status e observações gerenciais da visita, sem substituir os dados formais da OS externa.                                                   |
| **RF18** | Um serviço deve suportar múltiplas garantias, distinguindo garantia de `SERVIÇO` e de `FABRICANTE`.                                                                                         |
| **RF19** | As garantias devem registrar data de início e término, descrição e referência opcional ao produto. Caso haja fabricante, o nome dele e a data da garantia devem ser informados manualmente. |
| **RF20** | Um serviço deve suportar múltiplas revisões com data prevista e status `PENDENTE`, `AGENDADA`, `REALIZADA` ou `CANCELADA`.                                                                  |
| **RF21** | O sistema deve exibir alertas internos para revisões próximas/atrasadas e garantias, tanto do fabricante quanto do serviço, próximas do vencimento.                                         |
| **RF22** | O dashboard deve apresentar ao menos orçamentos pendentes, serviços/visitas próximas, revisões pendentes e garantias próximas do vencimento.                                                |
| **RF23** | O sistema deve permitir busca e filtragem de clientes, serviços e agenda por data e status.                                                                                                 |
| **RF24** | Quando uma aprovação possuir evidência, o sistema deve permitir anexar arquivo nos formatos e limites definidos nos RNFs.                                                                   |

---

# 8. Requisitos Não Funcionais

| ID        | Categoria             | Critério                                                                                                                                                                       |
| --------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **RNF01** | Privacidade           | A aplicação deve ser exclusivamente interna e não deve expor páginas de dados do cliente sem autenticação.                                                                     |
| **RNF02** | Autorização           | Uma tentativa de acessar recurso não permitido ao perfil deve ser bloqueada no backend, independentemente de a interface ocultar ou não o botão.                               |
| **RNF03** | Segurança em trânsito | A implantação de produção deve utilizar HTTPS para todo acesso ao sistema.                                                                                                     |
| **RNF04** | Credenciais           | Senhas devem ser armazenadas apenas como hash resistente a senha; nenhuma senha em texto puro pode ser registrada em log.                                                      |
| **RNF05** | Desempenho            | Em carga de até 20 usuários internos concorrentes, 95% das operações comuns de consulta/cadastro devem responder em até 2 segundos, desconsiderando upload de arquivos.        |
| **RNF06** | Integridade           | Operações que envolvam orçamento, seus itens e mudança de estado devem utilizar transação quando houver múltiplas alterações dependentes.                                      |
| **RNF07** | Mensagens de erro     | Falhas de validação devem identificar o campo ou regra violada e não devem resultar apenas em mensagem genérica.                                                               |
| **RNF08** | Arquivos              | Evidências de aprovação devem aceitar PDF, PNG, JPG/JPEG com no máximo 10 MB por arquivo; arquivos maiores ou de tipo não aceito devem ser recusados com explicação do limite. |
| **RNF09** | Backup                | O banco de dados e o armazenamento de arquivos/evidências devem possuir estratégia de backup automático diário.                                                                |
| **RNF10** | Responsividade        | Fluxos essenciais devem funcionar sem rolagem horizontal indevida em larguras de 360 px, 768 px e 1280 px.                                                                     |
| **RNF11** | Compatibilidade       | A aplicação deve ser validada na versão estável mais recente do Chrome e, opcionalmente, do Firefox.                                                                           |
| **RNF12** | Observabilidade       | Erros de servidor devem ser registrados com data/hora e contexto técnico suficiente para diagnóstico, sem incluir senhas ou conteúdo sensível desnecessário.                   |
| **RNF13** | Qualidade             | O pipeline de integração deve falhar se lint, verificação de tipos ou testes automatizados obrigatórios falharem.                                                              |
| **RNF14** | Persistência temporal | Registros críticos devem manter `created_at`/`updated_at` e autoria quando aplicável, permitindo identificar quando e por quem a informação foi criada.                        |

---

# 9. Histórias de Usuário

| ID       | História                                                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **US01** | Como usuário interno, quero me autenticar para acessar apenas as funcionalidades permitidas ao meu perfil.                                     |
| **US02** | Como gestor, quero administrar usuários e perfis para controlar quem pode acessar cada parte do sistema.                                       |
| **US03** | Como planejador, quero cadastrar clientes, contatos e locais para reutilizar essas informações em orçamentos e serviços.                       |
| **US04** | Como planejador, quero montar um orçamento com itens para formalizar uma proposta ao cliente.                                                  |
| **US05** | Como planejador, quero registrar a decisão de um orçamento e guardar evidência opcional para manter seu histórico comercial.                   |
| **US06** | Como planejador, quero criar um serviço a partir de orçamento aprovado ou diretamente para não forçar todo atendimento a passar por orçamento. |
| **US07** | Como planejador, quero agendar a execução de um serviço e atribuir técnicos para organizar a agenda da equipe.                                 |
| **US08** | Como técnico, quero visualizar minha agenda e dados necessários do atendimento para saber onde e quando devo executar o serviço.               |
| **US09** | Como técnico, quero registrar informações básicas da visita para manter o planejamento atualizado sem duplicar a OS oficial.                   |
| **US10** | Como planejador, quero registrar garantias de serviço e fabricante separadamente para controlar vencimentos diferentes.                        |
| **US11** | Como planejador, quero programar revisões futuras para que a empresa não perca o momento de retornar ao cliente.                               |
| **US12** | Como usuário interno, quero ver alertas de revisão e garantia no sistema para priorizar pendências.                                            |
| **US13** | Como gestor, quero ver um dashboard do fluxo comercial e operacional para identificar o que precisa de atenção.                                |
| **US14** | Como planejador, quero vincular o número da OS externa a um serviço para cruzar o novo sistema com o software atual.                           |

---

# 10. Casos de Uso

## 10.1 Diagrama geral

O diagrama geral apresenta os casos de uso do sistema interno TechPro e a associação dos atores — Gestor/Admin, Orçamento/Planejamento e Técnico — com cada funcionalidade.

![Diagrama geral de casos de uso da TechPro](/assets/images/prd/diagrama-casos-de-uso.png)

## 10.2 Catálogo e rastreabilidade

| ID       | Caso de uso                            | Atores                   | RFs             | Histórias       |
| -------- | -------------------------------------- | ------------------------ | --------------- | --------------- |
| **UC01** | Autenticar-se                          | Todos                    | RF01, RF03      | US01            |
| **UC02** | Gerenciar clientes, contatos e locais  | Admin, Planejamento      | RF04-RF06, RF23 | US03            |
| **UC03** | Criar e editar orçamento               | Admin, Planejamento      | RF07-RF08       | US04            |
| **UC04** | Registrar decisão do orçamento         | Admin, Planejamento      | RF09-RF10, RF24 | US05            |
| **UC05** | Criar e planejar serviço               | Admin, Planejamento      | RF11-RF15       | US06-US07, US14 |
| **UC06** | Consultar agenda / visita              | Todos conforme permissão | RF16, RF23      | US07-US08       |
| **UC07** | Registrar execução gerencial da visita | Técnico, Admin           | RF17            | US09            |
| **UC08** | Gerenciar garantias                    | Admin, Planejamento      | RF18-RF19, RF21 | US10, US12      |
| **UC09** | Gerenciar revisões                     | Admin, Planejamento      | RF20-RF21       | US11-US12       |
| **UC10** | Visualizar alertas e dashboard         | Todos conforme permissão | RF21-RF22       | US12-US13       |
| **UC11** | Gerenciar usuários                     | Admin                    | RF02-RF03       | US02            |

## 10.3 Casos de uso detalhados com regras de negócio

### UC03 — Criar e editar orçamento

| Campo               | Definição                                                                             |
| ------------------- | ------------------------------------------------------------------------------------- |
| **Atores**          | Gestor/Admin; Orçamento/Planejamento                                                  |
| **Pré-condições**   | Usuário autenticado e cliente existente.                                              |
| **Gatilho**         | Usuário deseja criar ou alterar uma proposta comercial.                               |
| **Pós-condições**   | O orçamento fica registrado no histórico do cliente com seus itens, valores e status. |
| **Rastreabilidade** | RF07-RF08; US04.                                                                      |

#### Fluxo principal

1. Selecionar o cliente.
2. Criar um novo orçamento.
3. Adicionar um ou mais itens.
4. Informar tipo, descrição, quantidade, preço unitário e desconto.
5. O sistema calcula subtotal e total.
6. Salvar o orçamento.
7. O orçamento pode ser posteriormente editado.

#### Fluxos alternativos / exceções

- Se quantidade ou preço forem inválidos, o sistema recusa a gravação e identifica o campo.
- Um orçamento sem itens não pode ser considerado pronto para envio.

#### Regras de negócio

- **RN-ORC-01:** o total do orçamento é derivado dos itens e descontos.
- **RN-ORC-02:** cada item deve ser classificado como `PRODUTO`, `SERVIÇO` ou `OUTRO`.
- **RN-ORC-03:** um orçamento deve possuir pelo menos um item antes de ser considerado pronto para envio.

### UC04 — Registrar decisão do orçamento

| Campo               | Definição                                                                    |
| ------------------- | ---------------------------------------------------------------------------- |
| **Atores**          | Gestor/Admin; Orçamento/Planejamento                                         |
| **Pré-condições**   | Existe um orçamento registrado e o cliente comunicou uma decisão.            |
| **Gatilho**         | Usuário registra aprovação, rejeição ou expiração.                           |
| **Pós-condições**   | A decisão fica registrada no orçamento e disponível no histórico do cliente. |
| **Rastreabilidade** | RF09-RF10, RF24; RNF08; US05.                                                |

#### Fluxo principal

1. Abrir o orçamento.
2. Escolher a decisão.
3. Informar data da decisão e observação quando necessária.
4. Opcionalmente anexar evidência da aprovação.
5. Confirmar.
6. Em caso de aprovação, disponibilizar ação para criar serviço a partir do orçamento.

#### Fluxos alternativos / exceções

- Arquivo acima de 10 MB ou de tipo não permitido é recusado e o limite é informado.

#### Regras de negócio

- **RN-APR-01:** um orçamento possui apenas um estado atual de decisão.
- **RN-APR-02:** a evidência é opcional; a aprovação pode existir apenas com data e registro do usuário.
- **RN-APR-03:** aprovar um orçamento não cria nem altera estoque ou OS no software externo.

### UC05 — Criar e planejar serviço

| Campo               | Definição                                                              |
| ------------------- | ---------------------------------------------------------------------- |
| **Atores**          | Gestor/Admin; Orçamento/Planejamento                                   |
| **Pré-condições**   | Cliente existente; para origem `ORÇAMENTO`, existe orçamento aprovado. |
| **Gatilho**         | Usuário precisa planejar uma execução.                                 |
| **Pós-condições**   | Serviço e visitas ficam visíveis na agenda dos técnicos atribuídos.    |
| **Rastreabilidade** | RF11-RF15; US06-US07, US14.                                            |

#### Fluxo principal

1. Escolher criação a partir de orçamento aprovado ou serviço direto.
2. Definir cliente, local, descrição, origem e período planejado.
3. Quando existir, informar número da OS externa.
4. Adicionar uma ou mais visitas com data e horário.
5. Atribuir um ou mais técnicos a cada visita.
6. Salvar o planejamento.

#### Fluxos alternativos / exceções

- Serviço direto não exige orçamento.
- A referência de OS pode ser preenchida depois do planejamento.

#### Regras de negócio

- **RN-SRV-01:** vínculo com orçamento é opcional, exceto quando `origem=ORCAMENTO`.
- **RN-SRV-02:** a OS oficial permanece no sistema atual; `external_os_number` é apenas referência.
- **RN-SRV-03:** uma visita pode possuir vários técnicos e um técnico pode participar de várias visitas.

### UC08 — Gerenciar garantias

| Campo               | Definição                                                               |
| ------------------- | ----------------------------------------------------------------------- |
| **Atores**          | Gestor/Admin; Orçamento/Planejamento                                    |
| **Pré-condições**   | Existe serviço registrado.                                              |
| **Gatilho**         | Usuário cadastra garantia após conclusão/entrega.                       |
| **Pós-condições**   | Garantia fica vinculada ao serviço e monitorada pelo painel de alertas. |
| **Rastreabilidade** | RF18-RF19, RF21; US10, US12.                                            |

#### Fluxo principal

1. Selecionar o serviço.
2. Escolher tipo `SERVICO` ou `FABRICANTE`.
3. Informar período de vigência.
4. Para fabricante, informar quando disponível fabricante e referência do produto.
5. Salvar.
6. O sistema passa a considerar a data de término para alertas internos.

#### Fluxos alternativos / exceções

- O mesmo serviço pode possuir várias garantias.
- Garantias de fabricante podem ter datas diferentes entre produtos.

#### Regras de negócio

- **RN-GAR-01:** garantia da TechPro e garantia do fabricante são registros independentes.
- **RN-GAR-02:** `ends_at` deve ser posterior ou igual a `starts_at`.
- **RN-GAR-03:** alerta não envia comunicação externa no MVP.

### UC09 — Gerenciar revisões

| Campo               | Definição                                                             |
| ------------------- | --------------------------------------------------------------------- |
| **Atores**          | Gestor/Admin; Orçamento/Planejamento                                  |
| **Pré-condições**   | Existe serviço registrado.                                            |
| **Gatilho**         | Empresa deseja programar retorno/revisão.                             |
| **Pós-condições**   | Revisões futuras ficam visíveis em alertas e no histórico do serviço. |
| **Rastreabilidade** | RF20-RF21; US11-US12.                                                 |

#### Fluxo principal

1. Selecionar serviço.
2. Cadastrar uma ou mais datas previstas de revisão.
3. Manter status inicial `PENDENTE`.
4. Ao combinar atendimento, alterar para `AGENDADA` e opcionalmente associar uma visita.
5. Após atendimento, marcar `REALIZADA`; se não for mais necessária, `CANCELADA`.

#### Fluxos alternativos / exceções

- Revisão vencida e não realizada permanece identificada como pendência.
- Uma revisão pode existir sem visita até que seja agendada.

#### Regras de negócio

- **RN-REV-01:** status válidos são `PENDENTE`, `AGENDADA`, `REALIZADA` e `CANCELADA`.
- **RN-REV-02:** serviço pode possuir várias revisões futuras.
- **RN-REV-03:** comunicação automática por WhatsApp/e-mail está fora do MVP.

---

# 11. Modelo de Banco de Dados

Foi adotado um modelo relacional. Abaixo é apresentado o diagrama das principais entidades e cardinalidades.

![Diagrama Entidade-Relacionamento da TechPro](/assets/images/prd/diagrama-entidade-relacionamento.png)

## 11.1 Entidades principais

| Entidade              | Responsabilidade                                                              |
| --------------------- | ----------------------------------------------------------------------------- |
| **USERS**             | Usuários internos e papel de acesso.                                          |
| **CLIENTS**           | Cliente pessoa física ou jurídica.                                            |
| **CLIENT_CONTACTS**   | Múltiplas pessoas de contato por cliente.                                     |
| **SERVICE_LOCATIONS** | Múltiplos locais de atendimento por cliente.                                  |
| **QUOTES**            | Orçamento comercial associado ao cliente, contendo valores, status e decisão. |
| **QUOTE_ITEMS**       | Itens associados a cada orçamento.                                            |
| **SERVICES**          | Planejamento macro do atendimento/serviço.                                    |
| **SERVICE_VISITS**    | Idas/agendamentos vinculados ao serviço.                                      |
| **VISIT_TECHNICIANS** | Relação N:N entre visita e técnico.                                           |
| **WARRANTIES**        | Garantias de serviço ou fabricante.                                           |
| **REVISIONS**         | Revisões futuras e seus estados.                                              |
| **NOTIFICATIONS**     | Alertas internos associados a usuários/entidades.                             |

---

# 12. Decisões de Implementação

## 12.1 Decisões Gerais

| Decisão                       | Diretriz                                                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Arquitetura**               | Aplicação web com frontend e API separáveis, mantendo fronteiras claras entre interface, regras de negócio e persistência.        |
| **Frontend**                  | React com TypeScript. Interface responsiva para desktop e dispositivos utilizados pelos técnicos.                                 |
| **Backend**                   | Node.js com TypeScript e API REST.                                                                                                |
| **Persistência**              | PostgreSQL como banco relacional.                                                                                                 |
| **Armazenamento de arquivos** | Supabase Storage será utilizado para armazenar evidências e imagens do sistema em um bucket privado.                              |
| **ORM**                       | Prisma para schema, migrations e acesso tipado ao banco.                                                                          |
| **Validação**                 | Zod para validar payloads/DTOs nos limites da API.                                                                                |
| **Autenticação**              | Autenticação interna baseada em credenciais; JWT/sessão conforme implementação final, sempre com autorização validada no backend. |
| **Segurança HTTP**            | Helmet, CORS restritivo e rate limiting conforme o ambiente de produção.                                                          |
| **Execução local**            | Docker Compose como forma oficial de subir dependências e ambiente de desenvolvimento.                                            |
| **Arquivos**                  | Evidências devem ser armazenadas fora das tabelas binárias principais; o banco guarda metadados e referência do arquivo.          |
| **Integração externa**        | No MVP, não existe integração automática com software de OS/estoque; apenas referência manual.                                    |

## 12.2 Decisões de Teste

| Decisão                  | Diretriz                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| **Testes unitários**     | Cobrir regras de cálculo de orçamento, estados, garantias e revisões.                           |
| **Testes de integração** | Validar API, persistência, autenticação e autorização entre perfis.                             |
| **Testes de fluxo**      | Validar os fluxos `cliente → orçamento → serviço → agendamento` e `serviço → garantia/revisão`. |
| **Validações**           | Testar entradas inválidas, permissões indevidas e arquivos fora do formato/tamanho aceito.      |
| **CI**                   | Testes automatizados obrigatórios devem ser executados no pipeline antes da integração.         |

---

# 13. Fora de Escopo e Itens Opcionais

## 13.1 Opcional para o MVP

- Indicadores adicionais no dashboard além do conjunto mínimo definido em RF22.

## 13.2 Fora do MVP

- Versionamento imutável de orçamentos.
- Automação de orçamento.
- Pesquisa automática de preços.
- Busca automatizada de licitações relevantes para a TechPro.
- Registro de vendas de produtos realizadas por técnicos.
- Sincronização automática com OS, produtos e estoque do software existente.
- Substituição do sistema atual de estoque/OS.
- Envio automático de mensagens por WhatsApp/e-mail.
- Portal/login para clientes externos.

---

# 14. Glossário

| Termo                      | Definição                                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Orçamento**              | Proposta comercial vinculada a um cliente, composta por itens, valores e um estado de decisão.                                      |
| **Serviço**                | Registro interno de planejamento e acompanhamento; pode nascer de orçamento aprovado ou diretamente.                                |
| **Visita**                 | Agendamento específico dentro de um serviço, com data/horário e técnicos atribuídos.                                                |
| **OS externa**             | Número/referência da ordem de serviço mantida no software que a TechPro já utiliza.                                                 |
| **Venda**                  | Funcionalidade futura para registro comercial de produtos vendidos por técnicos/admin, sem movimentação de estoque no novo sistema. |
| **Garantia de serviço**    | Cobertura oferecida pela TechPro referente ao serviço executado.                                                                    |
| **Garantia de fabricante** | Cobertura do fabricante referente a um equipamento/produto.                                                                         |
| **Revisão**                | Retorno futuro programado para acompanhamento/manutenção do serviço.                                                                |
| **Licitação**              | Processo cuja busca automatizada é prevista como evolução futura do sistema.                                                        |
| **MVP**                    | Menor versão do produto que resolve o núcleo do problema e pode ser validada com o cliente.                                         |
