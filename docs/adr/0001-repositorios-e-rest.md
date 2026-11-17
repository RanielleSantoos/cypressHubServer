# ADR 0001 · Repositórios independentes e API REST versionável

**Estado** · Aceito na Etapa 1.

O Cypress Hub usa repositórios Angular e NestJS independentes com lockfiles e ciclos de build próprios. O contrato JSON e o OpenAPI coordenam as mudanças entre os projetos. O NestJS configura versionamento de URI com `/api/v1` e expõe aliases sob `/api` para os consumidores locais. Ao evoluir o contrato, preserve o comportamento de v1 para os consumidores que dependem dele.

Os builds independentes permitem implantar e reverter cada artefato na sua própria janela, desde que o contrato permaneça compatível. O monitoramento futuro poderá publicar eventos em um canal separado.
