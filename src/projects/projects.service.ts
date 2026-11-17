import { Injectable, NotFoundException } from '@nestjs/common';
import type { Project } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateProjectDto } from './project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<Project[]> {
    return this.prisma.project.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
  }

  async find(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Projeto não encontrado.');
    return project;
  }

  create({ name, description, repositoryUrl }: CreateProjectDto): Promise<Project> {
    return this.prisma.project.create({ data: { name, description, repositoryUrl } });
  }
}
