import { CypressReportsController } from './cypress/cypress-reports.controller';
import { Module } from '@nestjs/common';
import { CypressCatalogController, CypressCatalogService } from './cypress/cypress.controller';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';
import { ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';
import { WorkspaceController } from './workspace/workspace.controller';
import { WorkspaceService } from './workspace/workspace.service';

@Module({
  controllers: [HealthController, ProjectsController, WorkspaceController, CypressCatalogController, CypressReportsController],
  providers: [PrismaService, ProjectsService, WorkspaceService, CypressCatalogService],
})
export class AppModule {}
