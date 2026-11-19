import { BadRequestException, Controller, DefaultValuePipe, Get, NotFoundException, Param, ParseBoolPipe, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiOkResponse, ApiProduces, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { open, readdir, realpath, stat } from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import { basename, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';

class CypressReportDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  path!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

const isInside = (root: string, path: string) => {
  const distance = relative(root, path);
  return distance !== '' && distance !== '..' && !distance.startsWith('..' + sep) && !isAbsolute(distance);
};
const isPdf = (file: string) => extname(file).toLowerCase() === '.pdf';

async function reportsDirectory(): Promise<string | null> {
  const configured = process.env.CYPRESS_PROJECT_DIR?.trim();
  if (!configured || !isAbsolute(configured)) {
    throw new BadRequestException('Configure CYPRESS_PROJECT_DIR para visualizar os relatórios.');
  }
  const root = await realpath(configured).catch(() => null);
  if (!root) throw new BadRequestException('Não foi possível acessar o projeto Cypress configurado.');
  const directory = await realpath(join(root, 'cypress', 'relatorios')).catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw new BadRequestException('Não foi possível acessar a pasta de relatórios.');
  });
  if (directory && !isInside(root, directory)) {
    throw new BadRequestException('A pasta de relatórios deve permanecer dentro do projeto Cypress.');
  }
  return directory;
}

@ApiTags('Relatórios Cypress')
@Controller('cypress/reports')
export class CypressReportsController {
  @Get()
  @ApiOkResponse({ type: [CypressReportDto] })
  async list(): Promise<CypressReportDto[]> {
    const directory = await reportsDirectory();
    if (!directory) return [];

    const reports: CypressReportDto[] = [];
    const scan = async (folder: string): Promise<void> => {
      const files = await readdir(folder, { withFileTypes: true });
      for (const file of files) {
        if (file.name.startsWith('.')) continue;
        const path = join(folder, file.name);
        if (file.isDirectory()) {
          await scan(path);
          continue;
        }
        if (!file.isFile() || !isPdf(file.name)) continue;
        const metadata = await stat(path).catch((error: unknown) => {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
          throw error;
        });
        if (!metadata?.isFile()) continue;
        const reportPath = relative(directory, path).split(sep).join('/');
        reports.push({
          id: Buffer.from(reportPath).toString('base64url'),
          path: reportPath,
          updatedAt: metadata.mtime.toISOString(),
        });
      }
    };
    await scan(directory);
    return reports.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.path.localeCompare(right.path));
  }

  @Get(':id')
  @ApiProduces('application/pdf')
  @ApiQuery({ name: 'download', required: false, type: Boolean, description: 'Enviar como anexo com o nome do documento.' })
  async view(
    @Param('id') id: string,
    @Query('download', new DefaultValuePipe(false), ParseBoolPipe) download: boolean,
    @Res({ passthrough: true }) response: ServerResponse,
  ): Promise<StreamableFile> {
    const path = /^[A-Za-z0-9_-]+$/.test(id) ? Buffer.from(id, 'base64url').toString('utf8') : '';
    const sections = path.split('/');
    if (!isPdf(path) || sections.some((part) => !part || part.startsWith('.') || /[\\:\u0000]/.test(part))) {
      throw new NotFoundException('Relatório não encontrado.');
    }

    const directory = await reportsDirectory();
    if (!directory) throw new NotFoundException('Relatório não encontrado.');
    const file = resolve(directory, ...sections);
    const canonical = await realpath(file).catch(() => null);
    if (!canonical || !isInside(directory, canonical) || relative(directory, canonical).split(sep).join('/') !== path) {
      throw new NotFoundException('Relatório não encontrado.');
    }
    const handle = await open(canonical, 'r').catch(() => null);
    if (!handle) throw new NotFoundException('Relatório não encontrado.');
    try {
      const metadata = await handle.stat();
      if (!metadata.isFile()) throw new NotFoundException('Relatório não encontrado.');
      const header = Buffer.alloc(5);
      await handle.read(header, 0, header.length, 0);
      if (header.toString('ascii') !== '%PDF-') throw new BadRequestException('O arquivo não é um PDF válido.');

      const filename = encodeURIComponent(basename(canonical))
        .replace(/['()*]/g, (character) => '%' + character.charCodeAt(0).toString(16).toUpperCase());
      response.setHeader('Cache-Control', 'no-store');
      return new StreamableFile(handle.createReadStream({ start: 0 }), {
        type: 'application/pdf',
        disposition: download ? `attachment; filename*=UTF-8''${filename}` : 'inline',
        length: metadata.size,
      });
    } catch (error) {
      await handle.close();
      throw error;
    }
  }
}
