import { BadRequestException, Controller, Get, HttpCode, Injectable, NotFoundException, Post } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { access, readFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { PrismaService } from '../prisma.service';
import { discoverSpecs, DiscoveredSpec } from './discover-specs';

const integrationKey = 'evolog-cypress';
const projectFields = { id: true, name: true } as const;

class CatalogDto {
  @ApiProperty({ type: 'object', properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' } } })
  project!: { id: string; name: string };

  @ApiProperty()
  configured!: boolean;

  @ApiProperty()
  specs!: number;

  @ApiProperty()
  screens!: number;
}

@Injectable()
export class CypressCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async status(): Promise<CatalogDto> {
    const project = await this.project();
    const [specs, screens] = await Promise.all([
      this.prisma.testCase.count({ where: { projectId: project.id, specPath: { not: null }, specAvailable: true } }),
      this.prisma.screen.count({ where: { projectId: project.id } }),
    ]);
    return { project, configured: Boolean(process.env.CYPRESS_PROJECT_DIR?.trim()), specs, screens };
  }

  async sync(): Promise<CatalogDto> {
    const root = process.env.CYPRESS_PROJECT_DIR?.trim();
    if (!root || !isAbsolute(root)) {
      throw new BadRequestException('Configure CYPRESS_PROJECT_DIR com o caminho absoluto do evologCypress.');
    }

    let specs: DiscoveredSpec[];
    try {
      const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as {
        dependencies?: Record<string, string>; devDependencies?: Record<string, string>;
      };
      if (!(manifest.dependencies?.cypress || manifest.devDependencies?.cypress)) {
        throw new Error('Missing Cypress dependency');
      }
      await access(join(root, 'cypress.config.js'));
      specs = await discoverSpecs(root);
    } catch {
      throw new BadRequestException('Não foi possível ler o projeto Cypress configurado. Confira a pasta e as permissões.');
    }
    if (!specs.length) throw new BadRequestException('Nenhum spec encontrado em cypress/e2e.');
    if (specs.some((spec) => spec.path.length > 1000)) throw new BadRequestException('O caminho de um spec excede 1000 caracteres.');

    const { id: projectId } = await this.project();
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Project" WHERE id = ${projectId}::uuid FOR UPDATE`;
      const screens = new Map<string, string>();

      for (const spec of specs) {
        if (spec.screenDirectory && spec.screenName && !screens.has(spec.screenDirectory)) {
          const screen = await tx.screen.upsert({
            where: { projectId_sourceDirectory: { projectId, sourceDirectory: spec.screenDirectory } },
            create: { projectId, sourceDirectory: spec.screenDirectory, name: spec.screenName },
            update: {},
            select: { id: true },
          });
          screens.set(spec.screenDirectory, screen.id);
        }

        const screenId = spec.screenDirectory ? screens.get(spec.screenDirectory) : undefined;
        await tx.testCase.upsert({
          where: { projectId_specPath: { projectId, specPath: spec.path } },
          create: { projectId, name: spec.name, specPath: spec.path, screenId },
          update: { specAvailable: true },
        });
      }

      await tx.testCase.updateMany({
        where: { projectId, specPath: { not: null, notIn: specs.map((spec) => spec.path) }, specAvailable: true },
        data: { specAvailable: false },
      });
    }, { timeout: 15000 });

    return this.status();
  }

  private async project(): Promise<CatalogDto['project']> {
    const project = await this.prisma.project.findUnique({ where: { integrationKey }, select: projectFields });
    if (!project) throw new NotFoundException('Projeto evologCypress indisponível. Aplique as migrations locais.');
    return project;
  }
}

@ApiTags('Integração Cypress')
@Controller('cypress')
export class CypressCatalogController {
  constructor(private readonly catalog: CypressCatalogService) {}

  @Get()
  @ApiOkResponse({ type: CatalogDto })
  status(): Promise<CatalogDto> {
    return this.catalog.status();
  }

  @Post('sync')
  @HttpCode(200)
  @ApiOkResponse({ type: CatalogDto })
  sync(): Promise<CatalogDto> {
    return this.catalog.sync();
  }
}
