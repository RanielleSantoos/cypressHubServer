# Contrato da API REST · v1

URL local `http://localhost:3000`. Use JSON em UTF-8. Os caminhos documentados em `/api` também aceitam `/api/v1`, com semântica idêntica. OpenAPI está em [Swagger UI](http://localhost:3000/api/docs) e [JSON](http://localhost:3000/api/docs-json).

| Método | Rota | Sucesso |
|---|---|---|
| GET | `/api/health` | 200 · `{"status":"ok"}` quando o processo atende requisições |
| GET | `/api/projects` | 200 · array de projetos do mais novo ao mais antigo, com desempate por ID decrescente |
| GET | `/api/projects/{id}` | 200 · projeto com UUID v4 |
| POST | `/api/projects` | 201 · projeto persistido |

O POST aceita `name` obrigatório com 1 a 120 caracteres, `description` opcional com até 1000 caracteres e `repositoryUrl` opcional com até 2048 caracteres. A URL exige HTTP ou HTTPS e rejeita credenciais embutidas. Utilize URLs sem tokens. O servidor remove espaços nas extremidades. Campos opcionais vazios, ausentes ou nulos são armazenados como `null`. Campos desconhecidos retornam 400. A resposta inclui `id`, `name`, `description`, `repositoryUrl`, `createdAt` e `updatedAt`, com datas ISO 8601 em UTC.

```powershell
$body = @{ name = 'Portal interno'; repositoryUrl = 'https://git.example.org/equipe/portal' } | ConvertTo-Json
Invoke-RestMethod http://localhost:3000/api/projects -Method Post -ContentType 'application/json' -Body $body
```

No Git Bash:

```bash
curl --fail http://localhost:3000/api/projects \
  --header 'Content-Type: application/json' \
  --data '{"name":"Portal interno","repositoryUrl":"https://git.example.org/equipe/portal"}'
```

Erros seguem o formato `{"statusCode":404,"messages":["Projeto não encontrado."]}`. Entradas ou IDs inválidos retornam 400. Um UUID válido e ausente retorna 404. Falhas de disponibilidade do banco reconhecidas pelo backend retornam 503. Falhas internas inesperadas retornam 500 com mensagem genérica.

## Área de trabalho

Use o prefixo `/api/projects/{projectId}/workspace` com o UUID do projeto. Os aliases `/api/v1` também se aplicam.

| Método | Sufixo | Entrada ou resposta |
|---|---|---|
| GET | raiz do prefixo | 200 · `{screens, tests, schedules}` |
| GET | `/screens` | 200 · telas do projeto para os filtros da consulta |
| GET | `/screens/{screenId}/tests` | 200 · casos associados à tela indicada |
| POST | `/screens` | 201 · `name` e `route` são obrigatórios |
| POST | `/tests` | 201 · `name` é obrigatório e `screenId` é opcional |
| POST | `/schedules` | 201 · `startAt` no futuro com fuso ISO 8601, `recurrence` e um tipo de alvo entre `screenIds`, `screenId` e `testId` |
| DELETE | `/tests/{id}` | 204 · remove caso de teste sem agendamento vinculado |
| DELETE | `/schedules/{id}` | 204 · cancela o planejamento |

As frequências aceitas são `ONCE`, `DAILY` e `WEEKLY`. Na consulta de casos por tela, um UUID de tela que pertence a outro projeto retorna 404. Crie um agendamento de telas com `screenIds`, uma lista não vazia de UUIDs únicos, do mesmo módulo e do mesmo projeto. Vincular telas de outro módulo ou projeto retorna 400. A resposta inclui `screenIds`. Para consultas e clientes antigos, `screenId`, `testId` e o alvo de todo o projeto continuam disponíveis. Excluir um teste vinculado a um agendamento retorna 409.

## Integração local do Cypress

| Método | Rota | Resultado |
|---|---|---|
| GET | `/api/cypress` | Projeto evologCypress, presença da configuração e contagem de telas e specs disponíveis |
| POST | `/api/cypress/sync` | Sincroniza as specs por caminho e devolve os totais atualizados. A origem vem do ambiente do backend. |

Após a sincronização, telas inferidas incluem `sourceDirectory` e podem ter `route` nula. Casos importados incluem `specPath` e `specAvailable`. O catálogo preserva os registros associados quando a spec desaparece. Remover um caso importado pelo endpoint de testes retorna 409.
