# ADR 0002 · PostgreSQL e migrações explícitas no desenvolvimento

**Estado** · Aceito na Etapa 1.

O Compose oferece PostgreSQL 18 para desenvolvimento no Windows com porta de loopback, volume persistente e healthcheck. O projeto Prisma registra o schema e o SQL versionado. O script de migração aceita a base de desenvolvimento no loopback e aplica migrações existentes com `prisma migrate deploy`. A inicialização da API independe de DDL.

O SGBD corporativo segue pendente. O serviço NestJS concentra o acesso a dados para limitar o impacto da troca de provider ou de estratégia de persistência. O DBA deverá aprovar o modelo físico e um fluxo separado de migração e rollback.
