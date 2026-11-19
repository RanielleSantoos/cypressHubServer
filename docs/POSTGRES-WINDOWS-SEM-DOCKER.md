# PostgreSQL portátil no Windows

Use Node.js 24 LTS x64 e acesso ao registro npm. Faça a primeira instalação dentro do repositório do backend, com o servidor NestJS encerrado.

```bash
test -f .env || cp .env.example .env
npm ci
npm run db:setup:windows
npm run db:migrate
npm run build
npm start
```

A configuração usa a `DATABASE_URL` local do exemplo e PostgreSQL 18.6 do pacote npm `@embedded-postgres/windows-x64`. Os executáveis, os dados e o log ficam em `.postgres-local`, ignorado pelo Git. O comando inicializa o cluster somente quando necessário e reutiliza os dados em novas chamadas.

Na próxima vez, `npm run db:start` ou o **F5** do workspace inicia o PostgreSQL portátil. Execute o F5 na pasta que contém os dois repositórios e sua pasta `.vscode`. Use a tarefa de migrations quando o schema mudar.

No `.env`, ajuste `CYPRESS_PROJECT_DIR` para o caminho absoluto do evologCypress nesta máquina. O Angular continua com `npm ci` e `npm start` em outro terminal.
