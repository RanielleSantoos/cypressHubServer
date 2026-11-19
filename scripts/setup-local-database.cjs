const { spawnSync } = require('node:child_process');
const { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const packageName = '@embedded-postgres/windows-x64';
const version = '18.6.0-beta.19';
const directory = join(__dirname, '..', '.postgres-local');
const native = join(directory, 'native');
const data = join(directory, 'data');
const control = join(native, 'bin', 'pg_ctl.exe');
const init = join(native, 'bin', 'initdb.exe');

function run(executable, args, failure) {
  const result = spawnSync(executable, args, { windowsHide: true, stdio: 'inherit' });
  if (result.error || result.status !== 0) throw new Error(failure);
}

function install() {
  if (existsSync(control) && existsSync(init)) return;
  if (existsSync(native)) throw new Error('A instalação em .postgres-local/native está incompleta. Preserve essa pasta e mova-a antes de tentar novamente.');
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error('Execute npm run db:setup:windows.');

  const stage = mkdtempSync(join(directory, 'download-'));
  try {
    run(process.execPath, [
      npmCli, 'install', '--prefix', stage, '--no-package-lock', '--no-audit', '--no-fund', packageName + '@' + version,
    ], 'Não foi possível baixar o PostgreSQL portátil pelo npm.');
    const downloaded = join(stage, 'node_modules', packageName, 'native');
    if (!existsSync(join(downloaded, 'bin', 'pg_ctl.exe')) || !existsSync(join(downloaded, 'bin', 'initdb.exe'))) {
      throw new Error('O pacote do PostgreSQL não contém os executáveis esperados.');
    }
    renameSync(downloaded, native);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

function initialize(password) {
  if (existsSync(join(data, 'PG_VERSION'))) return;
  const stage = mkdtempSync(join(directory, 'init-'));
  try {
    const passwordFile = join(stage, 'password');
    writeFileSync(passwordFile, password + '\n', { mode: 0o600, flag: 'wx' });
    run(init, [
      '-D', data, '-U', 'cypress_hub', '--auth-host=scram-sha-256', '--auth-local=scram-sha-256',
      '--encoding=UTF8', '--no-locale', '--pwfile=' + passwordFile,
    ], 'Não foi possível inicializar o PostgreSQL portátil.');
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

async function setup() {
  if (process.platform !== 'win32' || process.arch !== 'x64') {
    throw new Error('O instalador portátil exige Windows com Node.js x64.');
  }
  const url = URL.parse(process.env.DATABASE_URL ?? '');
  if (url?.protocol !== 'postgresql:' || url.hostname !== '127.0.0.1' || url.pathname !== '/cypress_hub_dev'
      || url.username !== 'cypress_hub' || !url.password
      || ![...url.searchParams].every(([key, value]) => key === 'schema' && value === 'public')) {
    throw new Error('Configure a DATABASE_URL local de .env.example antes de preparar o PostgreSQL portátil.');
  }
  const password = decodeURIComponent(url.password);
  if (/\r|\n|\0/.test(password)) throw new Error('Use uma senha local sem quebra de linha.');
  mkdirSync(directory, { recursive: true });
  install();
  initialize(password);
  run(process.execPath, [join(__dirname, 'start-local-database.cjs')], 'Não foi possível iniciar o PostgreSQL portátil.');

  const status = spawnSync(control, ['status', '-D', data], { windowsHide: true, stdio: 'ignore' });
  const port = url.port || '5432';
  const activePort = status.status === 0 ? readFileSync(join(data, 'postmaster.pid'), 'utf8').split(/\r?\n/)[3]?.trim() : '';
  if (activePort !== port) {
    throw new Error('A porta configurada não pertence ao PostgreSQL portátil do projeto. Confira o destino antes de prosseguir.');
  }

  url.pathname = '/postgres';
  url.search = '';
  const { PrismaClient } = require('@prisma/client');
  const admin = new PrismaClient({ datasourceUrl: url.href });
  try {
    const existing = await admin.$queryRaw`SELECT 1::int FROM pg_database WHERE datname = 'cypress_hub_dev'`;
    if (!existing.length) await admin.$executeRawUnsafe('CREATE DATABASE cypress_hub_dev');
  } catch {
    throw new Error('Não foi possível preparar cypress_hub_dev. Confira as credenciais locais e a geração do cliente Prisma.');
  } finally {
    await admin.$disconnect();
  }
  console.log('PostgreSQL portátil pronto. Execute npm run db:migrate para aplicar as migrations locais.');
}

setup().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
