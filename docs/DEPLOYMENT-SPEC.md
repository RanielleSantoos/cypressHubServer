# Especificação de implantação · proposta para go-live

A implantação depende da aprovação de infraestrutura, segurança e DBA. A tecnologia e a versão do SGBD corporativo estão em aberto.

## Artefatos e configuração

| Componente | Artefato e operação proposta |
|---|---|
| Angular | Gerar `dist/cypress-hub-frontend/browser` com `npm.cmd ci` e `npm.cmd run build`. Servir arquivos por HTTPS e usar fallback Angular para rotas de navegação. |
| API | Gerar o cliente compatível com o SGBD aprovado e compilar NestJS. Executar o artefato com a versão Node.js aprovada, `HOST`, `PORT`, origem e segredos injetados no runtime. |
| Proxy | Encaminhar `/api` pela mesma origem, preservando o prefixo e protegendo o acesso conforme política corporativa. Validar TLS, limites e exposição do Swagger. |
| Persistência | Validar provider, versão, driver, schema, tipos e privilégios. Produzir migração específica para o SGBD aprovado e executá-la separadamente do runtime. |

A configuração Compose e o script `db:migrate` destinam-se ao banco local. O artefato local de persistência usa tipos PostgreSQL. Se a tecnologia aprovada exigir outra base ou driver, defina a adaptação em homologação e repita os testes de contrato e de dados.

## Ordem de implantação e rollback

1. Aprovar a versão do contrato da API, a estratégia de SSO/RBAC, a infraestrutura e a janela de mudança.
2. Validar backup restaurável e ensaiar a migração com uma massa representativa em homologação. Definir se dados de desenvolvimento serão descartados ou reconciliados.
3. Aplicar scripts aprovados com a identidade de migração e validar schema, permissões e consistência.
4. Implantar API e frontend, validar saúde, leitura, escrita autorizada e telemetria.
5. Se os critérios de aceitação falharem, executar o plano ensaiado. Reimplantar artefatos anteriores quando o schema for retrocompatível. Para alteração de dados, usar a reversão ou restauração aprovada pelo DBA conforme RPO e RTO.

A aprovação final e os itens pendentes estão no [checklist de go-live](GO-LIVE-CHECKLIST.md).
