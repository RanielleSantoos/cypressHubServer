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
