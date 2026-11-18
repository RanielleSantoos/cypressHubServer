# ADR 0004 · Catálogo local do evologCypress

**Estado** · Aceito.

Uma chave estável identifica o projeto que o Angular apresenta. A migration adota o cadastro existente com o nome evologCypress quando disponível e conserva os outros projetos para os consumidores da API existente.

O operador configura um diretório absoluto no backend. O endpoint de sincronização lê caminhos relativos sob `cypress/e2e`. Ele não carrega arquivos de teste ou configurações Cypress como código. A combinação de projeto e caminho relativo identifica a spec. A combinação de projeto e pasta de origem identifica a tela inferida. Uma transação preserva os registros e marca arquivos removidos como ausentes. O catálogo é agrupado por módulos e mantém as specs de API sem uma tela associada.

A execução fica reservada a um worker isolado, com ambiente autorizado e fila próprios. A interface apresenta o planejamento e o catálogo atuais, com áreas de Execuções e Relatórios aguardando os resultados do runner.
