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
