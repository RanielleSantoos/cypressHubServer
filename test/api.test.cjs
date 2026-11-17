const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { after, before, test } = require('node:test');
const { Test } = require('@nestjs/testing');
const { AppModule } = require('../dist/app.module');
const { configure } = require('../dist/configure');
const { PrismaService } = require('../dist/prisma.service');

const origin = 'http://localhost:4200';
const projects = [];
const prisma = {
  project: {
    findMany: async () => [...projects].reverse(),
    findUnique: async ({ where: { id } }) => projects.find((project) => project.id === id) ?? null,
    create: async ({ data }) => {
      const now = new Date();
      const project = {
        id: randomUUID(),
        name: data.name,
        description: data.description ?? null,
        repositoryUrl: data.repositoryUrl ?? null,
        createdAt: now,
        updatedAt: now,
      };
      projects.push(project);
      return project;
    },
  },
};

let app;
let url;

before(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService).useValue(prisma)
    .compile();
  app = moduleRef.createNestApplication({ logger: false });
  configure(app, origin);
  await app.listen(0, '127.0.0.1');
  url = await app.getUrl();
});

after(async () => app?.close());

async function postProject(project) {
  return fetch(url + '/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
}

test('health responde nas rotas estável e versionada', async () => {
  for (const path of ['/api/health', '/api/v1/health']) {
    const response = await fetch(url + path);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  }
});

test('CORS autoriza o preflight do Angular e não autoriza outra origem', async () => {
  const headers = {
    Origin: origin,
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type',
  };
  const response = await fetch(url + '/api/projects', { method: 'OPTIONS', headers });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
  assert.match(response.headers.get('Access-Control-Allow-Methods'), /POST/);

  const differentOrigin = 'https://example.org';
  const denied = await fetch(url + '/api/projects', {
    method: 'OPTIONS',
    headers: { ...headers, Origin: differentOrigin },
  });
  assert.equal(denied.headers.get('Access-Control-Allow-Origin'), null);
});

test('Swagger descreve as rotas estável e versionada', async () => {
  const ui = await fetch(url + '/api/docs/');
  assert.equal(ui.status, 200);
  const response = await fetch(url + '/api/docs-json');
  assert.equal(response.status, 200);
  const { paths, components } = await response.json();
  assert.ok(paths['/api/projects'].post);
  assert.ok(paths['/api/v1/projects/{id}'].get);
  assert.ok(components.schemas.ProjectDto);
});

test('cadastra, lista e consulta um projeto pelo UUID', async () => {
  const response = await postProject({
    name: ' Portal interno ',
    description: '   ',
    repositoryUrl: 'https://git.example.org/equipe/portal',
  });
  assert.equal(response.status, 201);
  const project = await response.json();
  assert.equal(project.name, 'Portal interno');
  assert.equal(project.description, null);
  assert.equal(project.repositoryUrl, 'https://git.example.org/equipe/portal');
  assert.ok(Date.parse(project.createdAt));
  const listing = await fetch(url + '/api/v1/projects');
  assert.ok((await listing.json()).some(({ id }) => id === project.id));
  const detail = await fetch(url + '/api/projects/' + project.id);
  assert.equal(detail.status, 200);
  assert.deepEqual(await detail.json(), project);
});

test('rejeita entradas inválidas e devolve o formato de erro documentado', async () => {
  for (const invalid of [
    { name: ' ' }, { name: 123 }, { name: 'x'.repeat(121) }, { name: 'Válido', extra: true },
    { name: 'Válido', repositoryUrl: 'file:///repo' }, { name: 'Válido', repositoryUrl: 'https://user:pass@example.org/repo' },
  ]) {
    const response = await postProject(invalid);
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.statusCode, 400);
    assert.ok(body.messages.length > 0);
  }
  const invalidId = await fetch(url + '/api/projects/invalido');
  assert.equal(invalidId.status, 400);
  const missing = await fetch(url + '/api/projects/' + randomUUID());
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { statusCode: 404, messages: ['Projeto não encontrado.'] });
});
