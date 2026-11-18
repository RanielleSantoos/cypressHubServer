const assert = require('node:assert/strict');
const { test } = require('node:test');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { configure } = require('../dist/configure');
const { PrismaService } = require('../dist/prisma.service');

const database = URL.parse(process.env.DATABASE_URL ?? '');
if (database?.protocol !== 'postgresql:'
  || !['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)
  || database.pathname !== '/cypress_hub_dev'
  || ![...database.searchParams].every(([key, value]) => key === 'schema' && value === 'public')) {
  throw new Error('Use apenas o PostgreSQL local cypress_hub_dev para o teste de integração.');
}

test('persiste telas, testes e agendamentos com isolamento por projeto', async () => {
  const app = await NestFactory.create(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const ids = [];
  try {
    configure(app, 'http://localhost:4200');
    await app.listen(0, '127.0.0.1');
    const base = (await app.getUrl()) + '/api';

    async function request(path, method, expected, body) {
      const response = await fetch(base + path, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = response.status === 204 ? undefined : await response.json();
      assert.equal(response.status, expected, JSON.stringify(data));
      return data;
    }

    const project = await request('/projects', 'POST', 201, { name: 'Integração · catálogo' });
    ids.push(project.id);
    const other = await request('/projects', 'POST', 201, { name: 'Integração · isolamento' });
    ids.push(other.id);
    const path = '/projects/' + project.id + '/workspace';
    const otherPath = '/projects/' + other.id + '/workspace';

    await request(path + '/screens', 'POST', 400, { name: 'Login', route: '//example.org' });
    const screen = await request(path + '/screens', 'POST', 201, { name: 'Login', route: '/login' });
    await request(otherPath + '/tests', 'POST', 400, { name: 'Outro projeto', screenId: screen.id });
    const scenario = await request(path + '/tests', 'POST', 201, { name: 'Entrar com senha', screenId: screen.id });
    assert.deepEqual(await request(path + '/screens', 'GET', 200), [screen]);
    assert.deepEqual(await request(path + '/screens/' + screen.id + '/tests', 'GET', 200), [scenario]);
    await request(otherPath + '/screens/' + screen.id + '/tests', 'GET', 404);
    const date = (offset) => new Date(Date.now() + offset).toISOString();
    await request(path + '/schedules', 'POST', 400, { startAt: date(-3600000), recurrence: 'ONCE' });
    await request(path + '/schedules', 'POST', 400, {
      startAt: date(3600000), recurrence: 'ONCE', testId: scenario.id, screenId: screen.id,
    });
    await request(otherPath + '/schedules', 'POST', 400, {
      startAt: date(3600000), recurrence: 'ONCE', testId: scenario.id,
    });
    const schedule = await request(path + '/schedules', 'POST', 201, {
      startAt: date(3600000), recurrence: 'WEEKLY', testId: scenario.id,
    });

    assert.deepEqual(await request(path, 'GET', 200), { screens: [screen], tests: [scenario], schedules: [schedule] });
    assert.deepEqual(await request(otherPath, 'GET', 200), { screens: [], tests: [], schedules: [] });
    await request(otherPath + '/tests/' + scenario.id, 'DELETE', 404);
    await request(path + '/tests/' + scenario.id, 'DELETE', 409);
    await request(path + '/schedules/' + schedule.id, 'DELETE', 204);
    await request(path + '/tests/' + scenario.id, 'DELETE', 204);
    assert.deepEqual(await request(path, 'GET', 200), { screens: [screen], tests: [], schedules: [] });

    const second = await request(path + '/screens', 'POST', 201, { name: 'Perfil', route: '/perfil' });
    const imported = await prisma.screen.create({
      data: { projectId: project.id, name: 'Cargas', sourceDirectory: 'cypress/e2e/modETMS/relatorios/cargas' },
    });
    const external = await request(otherPath + '/screens', 'POST', 201, { name: 'Conta', route: '/conta' });
    assert.deepEqual(await request(path + '/screens/' + second.id + '/tests', 'GET', 200), []);
    const timing = { startAt: date(3600000), recurrence: 'DAILY' };
    for (const screenIds of [[], null, [screen.id, screen.id], [screen.id, imported.id], [screen.id, external.id]]) {
      await request(path + '/schedules', 'POST', 400, { ...timing, screenIds });
    }
    await request(path + '/schedules', 'POST', 400, { ...timing, screenId: screen.id, screenIds: [second.id] });
    const multi = await request(path + '/schedules', 'POST', 201, { ...timing, screenIds: [screen.id, second.id] });
    assert.equal(multi.screenId, null);
    assert.deepEqual([...multi.screenIds].sort(), [screen.id, second.id].sort());
    const verified = await request(path, 'GET', 200);
    assert.deepEqual(verified.schedules, [multi]);
    await request(path + '/schedules/' + multi.id, 'DELETE', 204);
    assert.equal(await prisma.scheduleScreen.count({ where: { scheduleId: multi.id } }), 0);
  } finally {
    try {
      if (ids.length) {
        const owned = { projectId: { in: ids } };
        await prisma.$transaction([
          prisma.schedule.deleteMany({ where: owned }),
          prisma.testCase.deleteMany({ where: owned }),
          prisma.screen.deleteMany({ where: owned }),
          prisma.project.deleteMany({ where: { id: { in: ids } } }),
        ]);
      }
    } finally {
      await app.close();
    }
  }
});
