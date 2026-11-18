# Modelo de dados · Etapa 1

O modelo lógico representa projetos cadastrados e URLs de repositório como metadados. O schema Prisma e a migration inicial estão em `cypress-hub-backend/prisma`.

| Coluna | PostgreSQL local | Regra |
|---|---|---|
| `id` | UUID | Chave primária. UUID v4 gerado pelo Prisma. |
| `name` | VARCHAR(120) | Obrigatório. Nomes iguais são permitidos. |
| `description` | VARCHAR(1000) | Opcional. |
| `repositoryUrl` | VARCHAR(2048) | Opcional. URL HTTP(S) validada na API. |
| `createdAt` | TIMESTAMPTZ(3) | Obrigatório. O SGBD atribui o horário de criação. |
| `updatedAt` | TIMESTAMPTZ(3) | Obrigatório. O Prisma preenche e mantém o valor. |

O índice composto `createdAt, id` apoia a ordenação da lista. A forma física acima é específica do PostgreSQL local. Valide provider, tipos, convenções, privilégios e índices com o DBA antes de gerar artefatos para homologação.

## Área de trabalho

- `Screen` associa ao projeto um nome de até 120 caracteres e uma rota interna de até 300 caracteres.
- `TestCase` guarda nome e vínculo opcional com uma tela do mesmo projeto.
- `Schedule` guarda data/hora inicial, frequência e alvo. Alvos possíveis são o projeto, uma tela ou um caso de teste. O PostgreSQL armazena o instante em `TIMESTAMPTZ(3)`.

As chaves estrangeiras compostas usam o UUID do projeto junto com o UUID da tela ou do teste. A remoção de um teste exige apagar primeiro agendamentos que dependam dele. Consulte a [decisão de arquitetura](adr/0003-area-de-trabalho.md).

A chave opcional `Project.integrationKey` fixa o projeto apresentado pelo Angular. O catálogo usa `Screen.sourceDirectory` e `TestCase.specPath` como chaves lógicas únicas por projeto. A rota das telas importadas é opcional. A flag `specAvailable` representa a presença do arquivo na última sincronização. Consulte [ADR 0004](adr/0004-catalogo-local-evolog.md).

`ScheduleScreen` associa uma ou mais telas de um mesmo módulo a um agendamento. A chave primária impede repetir a tela no mesmo horário registrado e as chaves estrangeiras compostas vinculam o agendamento e a tela ao mesmo projeto. Excluir um agendamento remove seus vínculos. Os campos legados de alvo permanecem disponíveis para registros existentes. Consulte [ADR 0005](adr/0005-consulta-e-agendamento-por-tela.md).
