const assert = require('node:assert/strict');
const { mkdir, mkdtemp, rm, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { dirname, join } = require('node:path');
const { test } = require('node:test');
const { discoverSpecs } = require('../dist/cypress/discover-specs');

test('descobre specs por pasta e mantém specs de API sem tela', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'hub-cypress-fixture-'));
  try {
    for (const relative of [
      'cypress/e2e/modETMS/relatórios/cargas/filtroPorData.cy.js',
      'cypress/e2e/modETMS/relatórios/cargas/consulta.cy.ts',
      'cypress/e2e/modETMS/relatórios/cargas/dados.json',
      'cypress/e2e/sentry-API/entregas.cy.js',
      'cypress/e2e/.cache/temporario.cy.js',
    ]) {
      const path = join(fixture, relative);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, 'throw new Error("Spec executada durante a descoberta")');
    }

    const specs = await discoverSpecs(fixture);
    assert.equal(specs.length, 3);
    const interfaceSpecs = specs.filter((spec) => spec.screenDirectory);
    assert.equal(interfaceSpecs.length, 2);
    assert.ok(interfaceSpecs.every((spec) => spec.screenDirectory === 'cypress/e2e/modETMS/relatórios/cargas'));
    assert.equal(specs.find((spec) => spec.name === 'Filtro Por Data').screenName, 'Cargas');
    assert.equal(specs.find((spec) => spec.name === 'Entregas').screenDirectory, null);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
