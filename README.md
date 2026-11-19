# Cypress Hub · Backend

API local de projetos, com NestJS 11.2.10, TypeScript 5.9.3, Prisma 6.19.3 e PostgreSQL 18.6. A documentação interativa usa NestJS Swagger 11.4.8. As dependências ficam fixadas no `package-lock.json`. Use Node.js 24 LTS e npm 11. Validação realizada com Node.js 24.22.3 e npm 11.9.0.

A área de trabalho de cada projeto registra telas, casos de teste e horários planejados. O disparo de execuções Cypress depende de um runner.

O frontend abre no projeto evologCypress. Configure a origem e importe os specs pelo [guia de integração local](docs/INTEGRACAO-EVOLOG.md).

## Executar no Windows

Abra esta pasta no VS Code e inicie o Docker Desktop. No Git Bash:

```bash
test -e .env || cp .env.example .env
npm ci
npm run db:generate
docker compose up -d --wait
docker compose ps
npm run db:migrate
npm run build
npm start
```

No PowerShell:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd ci
npm.cmd run db:generate
docker compose up -d --wait
docker compose ps
npm.cmd run db:migrate
npm.cmd run build
npm.cmd start
```

O servidor escuta em `127.0.0.1:3000`. A origem padrão autorizada no navegador é `http://localhost:4200`. Consulte [Swagger](http://localhost:3000/api/docs) e [OpenAPI JSON](http://localhost:3000/api/docs-json). Rotas REST de projetos e saúde também estão disponíveis sob `/api/v1`.

```bash
curl --fail http://localhost:3000/api/health
curl --fail http://localhost:3000/api/projects
```

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/projects
```

A etapa `db:migrate` aplica migrações já registradas somente ao banco local `cypress_hub_dev`. O processo da API não aplica migrações ao iniciar. Para parar o banco preservando o volume, use `docker compose down`.

## Build e testes

No Git Bash:

```bash
npm run db:generate
npm run build
npm test
```

No PowerShell:

```powershell
npm.cmd run db:generate
npm.cmd run build
npm.cmd test
```

A suíte HTTP usa a aplicação NestJS com substituto de Prisma e cobre saúde, CORS, Swagger, cadastro, listagem, consulta e erros. Para validar migração e persistência no PostgreSQL, siga o roteiro de [verificação integrada](docs/LOCAL-SETUP-WINDOWS.md#verificação-integrada).

Com as migrations aplicadas no banco local, execute `npm run test:integration` no Git Bash ou `npm.cmd run test:integration` no PowerShell. O teste cria registros de verificação, testa o isolamento entre projetos e remove os dados que criou ao terminar.

Se a geração falhar no download, verifique o acesso a `binaries.prisma.sh` e a configuração de proxy da rede. Consulte também a [arquitetura](docs/ARCHITECTURE.md), o [contrato REST](docs/API-SPEC.md), o [modelo de dados](docs/DATA-MODEL.md) e a [documentação de implantação](docs/DEPLOYMENT-SPEC.md).

## Notebook Windows sem Docker

A primeira configuração do PostgreSQL local pode ser feita com `npm run db:setup:windows`. Consulte o [guia do banco portátil](docs/POSTGRES-WINDOWS-SEM-DOCKER.md).
