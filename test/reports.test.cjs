const assert = require('node:assert/strict');
const { mkdir, mkdtemp, rm, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { test } = require('node:test');
const { Test } = require('@nestjs/testing');
const { configure } = require('../dist/configure');
const { CypressReportsController } = require('../dist/cypress/cypress-reports.controller');

test('lista apenas os PDFs de relatorios e serve o conteúdo para visualização e download', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cypress-hub-report-fixture-'));
  process.env.CYPRESS_PROJECT_DIR = root;
  const moduleRef = await Test.createTestingModule({ controllers: [CypressReportsController] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  try {
    configure(app, 'http://localhost:4200');
    await app.listen(0, '127.0.0.1');
    const url = (await app.getUrl()) + '/api/cypress/reports';
    assert.deepEqual(await (await fetch(url)).json(), []);

    const path = join(root, 'cypress', 'reports');
    await mkdir(path, { recursive: true });
    await writeFile(join(path, 'index.html'), '<html><body>Relatório local</body></html>');
    await writeFile(join(path, 'resultado.json'), '{}');
    await writeFile(join(root, 'privado.html'), 'fora da pasta de relatórios');
    const pdfPath = join(root, 'cypress', 'relatorios');
    await mkdir(pdfPath, { recursive: true });
    const pdfContent = '%PDF-1.4\n%%EOF\n';
    const filename = 'Relatório (Carga).pdf';
    await writeFile(join(pdfPath, filename), pdfContent);
    await writeFile(join(pdfPath, 'browser.json'), '{"name":"Chrome"}');
    await writeFile(join(pdfPath, 'email-preview.html'), '<html>Prévia de mensagem</html>');

    const reportList = await fetch(url);
    const reports = await reportList.json();
    assert.equal(reports.length, 1);
    const [pdf] = reports;
    assert.equal(pdf.path, filename);
    assert.ok(Date.parse(pdf.updatedAt));
    const pdfResponse = await fetch(url + '/' + pdf.id);
    assert.equal(pdfResponse.status, 200);
    assert.equal(pdfResponse.headers.get('content-type'), 'application/pdf');
    assert.equal(pdfResponse.headers.get('content-disposition'), 'inline');
    assert.equal(await pdfResponse.text(), pdfContent);

    const downloadUrl = url + '/' + pdf.id + '?download=true';
    const download = await fetch(downloadUrl);
    assert.equal(download.status, 200);
    assert.equal(download.headers.get('content-type'), 'application/pdf');
    assert.equal(download.headers.get('content-disposition'), "attachment; filename*=UTF-8''Relat%C3%B3rio%20%28Carga%29.pdf");
    assert.equal(await download.text(), pdfContent);

    await writeFile(join(pdfPath, 'invalido.pdf'), '<html>Arquivo com extensão incorreta</html>');
    const invalidId = Buffer.from('invalido.pdf').toString('base64url');
    assert.equal((await fetch(url + '/' + invalidId)).status, 400);
    assert.equal((await fetch(url + '/' + invalidId + '?download=true')).status, 400);

    for (const prohibited of ['index.html', 'email-preview.html', 'browser.json', '../privado.pdf']) {
      assert.equal((await fetch(url + '/' + Buffer.from(prohibited).toString('base64url'))).status, 404);
    }
  } finally {
    await app.close();
    delete process.env.CYPRESS_PROJECT_DIR;
    await rm(root, { recursive: true, force: true });
  }
});
