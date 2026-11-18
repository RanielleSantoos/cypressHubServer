# Projeto evologCypress

O Hub abre no projeto **evologCypress**. As telas, os casos, a documentação e os agendamentos do menu lateral usam o mesmo catálogo.

## Conectar no Windows

No `.env` do backend, defina o caminho absoluto da sua cópia do Cypress.

```dotenv
CYPRESS_PROJECT_DIR=D:/projetos/evologcypress
```

Com o PostgreSQL local iniciado, encerre o backend anterior e rode no Git Bash:

```bash
npm run db:generate &&
npm run db:migrate &&
npm run build &&
npm start
```

Abra o frontend e vá a **Integrações → Sincronizar catálogo**. O Hub lê a lista de arquivos de `cypress/e2e` que seguem o padrão `*.cy.{js,jsx,ts,tsx}`. Cada pasta com specs de interface vira um grupo de tela, organizado no menu pelo módulo. Uma spec pode representar vários cenários Cypress. A sincronização registra o caminho relativo do arquivo e atualiza o catálogo sem duplicar registros.

Em **Casos de teste**, selecione **Módulo** e **Tela** para carregar os casos vinculados. Em **Telas**, filtre por módulo e alterne entre lista e grade. Ao abrir uma tela, o Hub preenche os dois campos da consulta. Specs de API sem vínculo continuam no catálogo geral do projeto.

## Execução e agendamentos

Em **Agendamentos**, selecione um módulo para carregar seus menus e telas. Use **Menu** para filtrar a lista e marque uma ou mais telas do módulo. Selecione a data, a hora e a frequência para registrar o planejamento. A futura integração deverá disparar automaticamente os specs das telas selecionadas na data e hora agendadas.

Enquanto o worker está pendente, use o Cypress diretamente no repositório. Para uma execução confirmada em homologação, o script headless existente aceita a variável `ENVIRONMENT` e o caminho relativo exibido no Hub.

```bash
cd /d/projetos/evologcypress
ENVIRONMENT=qas npm run cy:run -- --spec 'cypress/e2e/caminho/do-teste.cy.js'
```

O projeto carrega `.env` antes de `.env-qas`. Confirme os destinos efetivos de homologação e a autorização para executar a spec antes de iniciar. As execuções manuais no terminal são observadas no Cypress.

## Integração do worker

O modelo de execução isola código Cypress e navegador em um worker Docker. A API envia à fila o identificador do agendamento ou da execução manual, ambiente aprovado, navegador e caminho relativo da spec. O worker usa a configuração do repositório e recebe os segredos por ambiente. Ele reporta duração, status e evidências à API. A fila Redis/BullMQ, o disparo recorrente e o histórico fazem parte dessa etapa de execução. Dashboard e Relatórios usam os dados retornados pelo worker.

Consulte as decisões de infraestrutura e dados em [Implantação](DEPLOYMENT-SPEC.md) e [Checklist de go-live](GO-LIVE-CHECKLIST.md).
