# ADR 0003 · Área de trabalho por projeto

**Estado** · Aceito na atualização da interface.

A área de trabalho registra telas, casos de teste e horários planejados no PostgreSQL. Todas as operações recebem o ID do projeto. Chaves estrangeiras compostas preservam o vínculo com o projeto e uma restrição de banco garante que o agendamento tenha no máximo um alvo específico.

A API agrupa as leituras em `GET /api/projects/{projectId}/workspace`. O menu lateral usa rotas Angular, com o projeto e o filtro de tela na URL quando aplicados. A análise documental acontece no navegador e sugere correspondências por termos. Quando o usuário confirma a criação, o novo caso é enviado à API.

O catálogo não registra resultados executados e a Agenda persiste somente a intenção de rodar. O disparo depende de runner e do fluxo de execução, que possuem requisitos próprios de autenticação, ambientes, fuso horário, concorrência e isolamento.
