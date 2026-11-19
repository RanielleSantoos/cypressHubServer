# ADR 0006 · Leitura dos relatórios Cypress locais

**Estado** · Aceito.

O backend lista exclusivamente os PDFs de `cypress/relatorios` dentro de `CYPRESS_PROJECT_DIR`. A tela Relatórios reúne os PDFs gerados, inclusive quando o Cypress rodou pelo terminal. O catálogo usa o horário de modificação do arquivo. `browser.json` contém metadados do navegador para o gerador de PDF. Os resultados ficam disponíveis enquanto os PDFs permanecerem na pasta.

A API verifica o cabeçalho e serve `application/pdf`. O Angular usa PDF.js para renderizar as páginas na interface. A API restringe os caminhos à pasta de relatórios e a leitura ocorre no sistema de arquivos.

O Angular apresenta os arquivos em uma grade e carrega o visualizador ao abrir um cartão. A mesma rota de leitura aceita `download=true` para transmitir o PDF como anexo com o nome original, inclusive quando o frontend roda em outra origem.
