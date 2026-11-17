import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';
import { ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';

@Module({
  controllers: [HealthController, ProjectsController],
  providers: [PrismaService, ProjectsService],
})
export class AppModule {}
