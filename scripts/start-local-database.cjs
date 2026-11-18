const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { Socket } = require('node:net');
const { join } = require('node:path');

function listening(host, port) {
  return new Promise((resolve) => {
    const socket = new Socket();
    const finish = (connected) => {
      socket.destroy();
      resolve(connected);
    };
    socket.setTimeout(1500).once('timeout', () => finish(false));
    socket.once('error', () => finish(false)).once('connect', () => finish(true));
    socket.connect({ host, port });
  });
}

async function start() {
  const database = URL.parse(process.env.DATABASE_URL ?? '');
  if (database?.protocol !== 'postgresql:'
    || !['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)
    || database.pathname !== '/cypress_hub_dev') {
    throw new Error('Configure DATABASE_URL para o PostgreSQL local cypress_hub_dev.');
  }

  const port = Number(database.port || 5432);
  const host = database.hostname === '[::1]' ? '::1' : database.hostname;
  if (await listening(host, port)) {
    console.log('O banco local já está escutando.');
    return;
  }

  const directory = join(__dirname, '..', '.postgres-local');
  const control = join(directory, 'native', 'bin', 'pg_ctl.exe');
  const data = join(directory, 'data');
  if (existsSync(control) && existsSync(join(data, 'PG_VERSION'))) {
    const log = join(directory, 'postgres.log');
    const result = spawnSync(control, ['start', '-D', data, '-l', log, '-o', `-h ${host} -p ${port}`, '-w'], {
      windowsHide: true, stdio: 'inherit',
    });
    if (result.error || result.status !== 0) throw new Error('Não foi possível iniciar o PostgreSQL local do workspace.');
    return;
  }

  if (port !== 5432) throw new Error('Suba o PostgreSQL local na porta configurada em DATABASE_URL.');
  const result = spawnSync('docker', ['compose', 'up', '-d', '--wait'], { windowsHide: true, stdio: 'inherit' });
  if (result.error?.code === 'ENOENT') throw new Error('Inicie o PostgreSQL local ou instale e abra o Docker Desktop.');
  if (result.error || result.status !== 0) throw new Error('O Docker Compose não conseguiu iniciar o PostgreSQL local.');
}

start().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
