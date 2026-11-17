# Instalação local no Windows e VS Code

Instale Node.js 24 LTS com npm, Git, VS Code e Docker Desktop com Docker Compose v2. Inicie o Docker Desktop em modo de contêineres Linux. Execute os comandos a partir da pasta que contém os dois repositórios.

No VS Code, use **Terminal → Selecionar Perfil Padrão → Git Bash** e abra um novo terminal.

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

## Verificação integrada

1. Em `docker compose ps`, confira se o serviço PostgreSQL está `healthy`.
2. Consulte `http://localhost:3000/api/health` e confira `{"status":"ok"}`.
3. Em **Visão geral**, confira o status da API e o número atual de projetos.
4. Abra **Projetos**, preencha o nome e envie o formulário. Recarregue a página e veja se o mesmo projeto permanece na lista.
5. Consulte o registro pelo UUID retornado na listagem.

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

## Diagnóstico

| Sintoma | Verificação |
|---|---|
| `docker` não encontrado ou daemon indisponível | Instale ou inicie o Docker Desktop, reabra o terminal e rode `docker version`. |
| Porta ocupada | Consulte `Get-NetTCPConnection -State Listen -LocalPort 5432,3000,4200`. Libere a porta ou ajuste os valores correspondentes no Compose, em `.env` e no ambiente Angular. |
| Prisma sem tipos ou sem binário | Rode `npm.cmd run db:generate`. Se o download falhar, revise o acesso a `binaries.prisma.sh`. |
| API saudável, listagem indisponível | Saúde mede o processo. Inspecione `docker compose ps`, `docker compose logs postgres`, a URL local e a aplicação da migration. |
| CORS no navegador | Confira se a origem acessada corresponde exatamente a `FRONTEND_ORIGIN`. Reinicie a API depois da alteração. |
| `npm.ps1` bloqueado | Use `npm.cmd` no PowerShell. |

Encerre os servidores com `Ctrl+C`. Na pasta do backend, rode `docker compose down` para parar o banco e conservar o volume.
