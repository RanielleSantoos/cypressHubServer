# ADR 0005 · Consulta e agendamento por tela

**Estado** · Aceito.

Casos de teste é uma consulta. O Angular carrega a lista de telas, exige a seleção de módulo e tela e só então solicita os casos daquela tela. A API verifica se a tela pertence ao projeto. O módulo e o menu são inferidos da pasta de origem das telas Cypress. Telas manuais ficam no grupo Telas cadastradas.

O agendamento registra uma ou mais telas do mesmo módulo. O relacionamento `ScheduleScreen` persiste a lista na mesma transação do horário. Chaves estrangeiras compostas preservam o vínculo com o projeto. Registros anteriores mantêm seus alvos e a API mantém os campos legados para clientes existentes.

A futura integração com o worker deverá carregar os specs disponíveis das telas selecionadas e disparar a execução automaticamente na data e hora agendadas. A execução deve respeitar a recorrência e o fuso definidos no planejamento do runner e registrar resultado e evidências.
