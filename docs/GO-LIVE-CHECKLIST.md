# Checklist de go-live · pendente de definições corporativas

Use em homologação com responsáveis e evidências registrados. A autorização do DBA precede qualquer acesso ao banco corporativo.

- [ ] Identificar SGBD, versão, driver, compatibilidade Prisma e schema dedicado.
- [ ] Aprovar owner do schema, conta de runtime com privilégios mínimos, conta de migração e autorização DDL.
- [ ] Revisar modelo físico, índices e migrações. Ensaiar migração e reconciliar dados se houver importação.
- [ ] Definir SSO, RBAC, segregação de ambientes, auditoria e proteção do Swagger.
- [ ] Aprovar rede, DNS, proxy, TLS, certificados, firewall e gestão de segredos.
- [ ] Aprovar logs, retenção, alertas, métricas, monitoramento e resposta a incidentes.
- [ ] Definir backup, retenção, RPO, RTO e evidência de restauração.
- [ ] Definir política de CI/CD, aprovadores, publicação dos dois artefatos e gestão de versões.
- [ ] Aprovar testes em ambiente representativo para integração, autorização, desempenho e recuperação.
- [ ] Definir responsáveis, janela, critérios de rollback e comunicação. Ensaiar rollback e obter aceite.
- [ ] Quando integrações futuras entrarem no escopo, aprovar armazenamento de evidências e acesso de workers à rede interna.

Consulte a [especificação de implantação](DEPLOYMENT-SPEC.md).
