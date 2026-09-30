# API de clientes

Todas as rotas abaixo exigem cookie de sessão de um usuário ativo com perfil
`ADMIN` ou `PLANNING`. Sem sessão, retornam `401`; `TECHNICIAN` recebe `403`,
inclusive nas consultas.

| Método | Rota | Resultado |
| --- | --- | --- |
| `GET` | `/api/clients` | `200`, lista completa por criação decrescente |
| `POST` | `/api/clients` | `201`, cliente criado |
| `GET` | `/api/clients/:id` | `200`, cliente encontrado |
| `PATCH` | `/api/clients/:id` | `200`, cliente atualizado |
| `PATCH` | `/api/clients/:id/activate` | `200`, `{ id, active: true }` |
| `PATCH` | `/api/clients/:id/deactivate` | `200`, `{ id, active: false }` |
| `DELETE` | `/api/clients/:id` | `200`, mesma inativação lógica |

`id` deve ser UUID. Consulta ou alteração de ID inexistente retorna `404`;
ID inválido, JSON inválido e campos inválidos retornam `400`. Email duplicado
retorna `409`. As respostas de erro usam `{ error, fields? }`.

O corpo de criação é um objeto direto, sem `clientData`:

```json
{
  "type": "INDIVIDUAL",
  "name": "Cliente Exemplo",
  "whatsapp": "51999999999",
  "location": "Lajeado/RS",
  "email": "cliente@example.com"
}
```

`type` aceita `INDIVIDUAL` ou `COMPANY`. `name`, `whatsapp` e `location` são
obrigatórios. `document`, `notes`, `contactName`, `phone` e `email` são
opcionais. `PATCH` aceita um ou mais desses campos e recusa campos desconhecidos,
`id`, `active` e datas. Email é normalizado para minúsculas; string vazia ou
apenas espaços vira `null`, permitindo vários clientes sem email. A inativação
preserva os dados e a unicidade do email.

Esta entrega cobre o cadastro básico existente. Contatos múltiplos, locais de
atendimento múltiplos e busca/filtragem do documento de requisitos ainda não têm
modelos ou endpoints próprios.
