import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProjectDto, ProjectDto } from './project.dto';

const fields = {
  id: true, name: true, description: true, repositoryUrl: true, createdAt: true, updatedAt: true,
} as const;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<ProjectDto[]> {
    return this.prisma.project.findMany({ select: fields, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
  }

  async find(id: string): Promise<ProjectDto> {
    const project = await this.prisma.project.findUnique({ where: { id }, select: fields });
    if (!project) throw new NotFoundException('Projeto não encontrado.');
    return project;
  }

  create({ name, description, repositoryUrl }: CreateProjectDto): Promise<ProjectDto> {
    return this.prisma.project.create({ data: { name, description, repositoryUrl }, select: fields });
  }
}
