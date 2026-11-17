const { spawnSync } = require('node:child_process');

const databaseUrl = URL.parse(process.env.DATABASE_URL ?? '');
const allowed = databaseUrl?.protocol === 'postgresql:'
  && ['127.0.0.1', 'localhost', '[::1]'].includes(databaseUrl.hostname)
  && databaseUrl.pathname === '/cypress_hub_dev'
  && [...databaseUrl.searchParams].every(([key, value]) => key === 'schema' && value === 'public');

if (!allowed) {
  console.error('Configure DATABASE_URL para o banco PostgreSQL local cypress_hub_dev.');
  process.exit(1);
}

const result = spawnSync(process.execPath, [
  require.resolve('prisma/build/index.js'),
  'migrate', 'deploy',
], { stdio: 'inherit' });

if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
