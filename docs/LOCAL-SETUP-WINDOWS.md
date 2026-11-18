# Instalação local no Windows e VS Code

Instale Node.js 24 LTS com npm, Git, VS Code e Docker Desktop com Docker Compose v2. Inicie o Docker Desktop em modo de contêineres Linux. Execute os comandos a partir da pasta que contém os dois repositórios.

No VS Code, use **Terminal → Selecionar Perfil Padrão → Git Bash** e abra um novo terminal.

## Rodar com F5

Abra no VS Code a pasta que contém `cypress-hub-backend` e `cypress-hub-frontend`. Na primeira execução, configure o `.env` do backend e instale as dependências dos dois projetos com `npm ci`. Execute **Banco local: iniciar PostgreSQL** em **Terminal → Executar Tarefa**, depois **Banco local: aplicar migrations**. Repita a tarefa de migration quando houver mudanças de schema.

Em **Executar e Depurar**, selecione **Cypress Hub · F5**. F5 inicia o banco local se necessário, gera o cliente Prisma, compila o NestJS e inicia os dois servidores. Abra [Cypress Hub](http://localhost:4200). Se os servidores já estiverem abertos em outros terminais, encerre-os com `Ctrl+C` antes de usar F5.

A tarefa usa um PostgreSQL já acessível na porta local configurada. Se houver uma instância provisionada em `.postgres-local`, ela inicia essa instância. Em uma instalação comum com Docker Desktop, usa o Compose.

Se `/api/health` responder e `/api/cypress` retornar `Cannot GET /api/cypress`, recompile e reinicie o backend para carregar as rotas atuais. Com **Cypress Hub · F5**, a compilação ocorre antes do início do backend.

## Terminal 1 · banco e API

No Git Bash:

```bash
cd cypress-hub-backend
node --version
npm --version
docker compose version
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
Set-Location .\cypress-hub-backend
node --version
npm.cmd --version
docker compose version
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd ci
npm.cmd run db:generate
docker compose up -d --wait
docker compose ps
npm.cmd run db:migrate
npm.cmd run build
npm.cmd start
```

Na primeira execução, copie `.env.example` para `.env`. Em execuções posteriores, mantenha suas configurações locais. O Compose usa a porta 5432 no loopback e persiste os dados em volume nomeado.

## Terminal 2 · Angular

No Git Bash:

```bash
cd cypress-hub-frontend
npm ci
npm start
```

No PowerShell:

```powershell
Set-Location .\cypress-hub-frontend
npm.cmd ci
npm.cmd start
```

Abra [Visão geral](http://localhost:4200) e [Swagger](http://localhost:3000/api/docs). Use o endereço `localhost:4200` para que a origem do navegador corresponda à configuração da API.

## Atualizar uma instalação existente

Encerre o backend com `Ctrl+C` antes de gerar o cliente Prisma. No Git Bash, dentro de `cypress-hub-backend` e com o PostgreSQL local iniciado:

```bash
npm run db:generate &&
npm run db:migrate &&
npm run build &&
npm start
```

A migration adiciona as tabelas de telas, casos de teste e agendamentos e preserva os projetos já cadastrados. Reinicie o frontend com `npm start` na pasta `cypress-hub-frontend`.

## Verificação integrada

1. Em `docker compose ps`, confira se o serviço PostgreSQL está `healthy`.
2. Consulte `http://localhost:3000/api/health` e confira `{"status":"ok"}`.
3. No **Dashboard**, confira a saúde da API.
4. Abra **Integrações** e sincronize o evologCypress. Veja o [guia do catálogo](INTEGRACAO-EVOLOG.md) para configurar o caminho.
5. Em **Telas**, confira o agrupamento por módulo e abra os casos vinculados.
6. Em **Agendamentos**, selecione um módulo, marque as telas que deseja agendar e registre um horário. Recarregue a página para conferir as telas e o planejamento salvos.

No Git Bash:

```bash
curl --fail http://localhost:3000/api/health
curl --fail http://localhost:3000/api/projects
read -r -p 'UUID do projeto: ' project_id
curl --fail "http://localhost:3000/api/projects/$project_id"
```

No PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
$projetos = Invoke-RestMethod http://localhost:3000/api/projects
$id = $projetos[0].id
Invoke-RestMethod "http://localhost:3000/api/projects/$id"
```

Execute `npm run build` e `npm test` em cada repositório. No PowerShell, use `npm.cmd` no lugar de `npm`. A geração do cliente Prisma precede o build do backend.

Com PostgreSQL local e migrations aplicadas, execute `npm run test:integration` no backend.

## Diagnóstico

| Sintoma | Verificação |
|---|---|
| `docker` não encontrado ou daemon indisponível | Instale ou inicie o Docker Desktop, reabra o terminal e rode `docker version`. |
| Porta ocupada | Consulte `Get-NetTCPConnection -State Listen -LocalPort 5432,3000,4200`. Libere a porta ou ajuste os valores correspondentes no Compose, em `.env` e no ambiente Angular. |
| Prisma sem tipos ou sem binário | Rode `npm.cmd run db:generate`. Se o download falhar, revise o acesso a `binaries.prisma.sh`. |
| Prisma retorna `EPERM` ao atualizar o motor | Encerre o backend que está utilizando o motor no Windows e rode novamente `npm run db:generate`. |
| API saudável, listagem indisponível | Saúde mede o processo. Inspecione `docker compose ps`, `docker compose logs postgres`, a URL local e a aplicação da migration. |
| CORS no navegador | Confira se a origem acessada corresponde exatamente a `FRONTEND_ORIGIN`. Reinicie a API depois da alteração. |
| `npm.ps1` bloqueado | Use `npm.cmd` no PowerShell. |

Encerre os servidores com `Ctrl+C`. Na pasta do backend, rode `docker compose down` para parar o banco e conservar o volume.
