import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateScheduleDto, CreateScreenDto, CreateTestDto, ScheduleDto, ScreenDto, TestDto, WorkspaceDto } from './workspace.dto';

const screenFields = { id: true, name: true, route: true, sourceDirectory: true } as const;
const testFields = { id: true, name: true, screenId: true, specPath: true, specAvailable: true } as const;
const byName = [{ name: 'asc' }, { id: 'asc' }] as const;
const scheduleFields = {
  id: true, startAt: true, recurrence: true, screenId: true, testId: true,
  screenTargets: { select: { screenId: true }, orderBy: { screenId: 'asc' } },
} as const satisfies Prisma.ScheduleSelect;

function toScheduleDto({ screenTargets, ...schedule }: Prisma.ScheduleGetPayload<{ select: typeof scheduleFields }>): ScheduleDto {
  return { ...schedule, screenIds: screenTargets.map(({ screenId }) => screenId) };
}

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async get(projectId: string): Promise<WorkspaceDto> {
    const workspace = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        screens: { select: screenFields, orderBy: [...byName] },
        tests: { select: testFields, orderBy: [...byName] },
        schedules: { select: scheduleFields, orderBy: [{ startAt: 'asc' }, { id: 'asc' }] },
      },
    });
    if (!workspace) throw new NotFoundException('Projeto não encontrado.');
    return { ...workspace, schedules: workspace.schedules.map(toScheduleDto) };
  }

  async listScreens(projectId: string): Promise<ScreenDto[]> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { screens: { select: screenFields, orderBy: [...byName] } },
    });
    if (!project) throw new NotFoundException('Projeto não encontrado.');
    return project.screens;
  }

  async listScreenTests(projectId: string, screenId: string): Promise<TestDto[]> {
    const screen = await this.prisma.screen.findUnique({
      where: { projectId_id: { projectId, id: screenId } },
      select: { tests: { select: testFields, orderBy: [...byName] } },
    });
    if (!screen) throw new NotFoundException('Tela não encontrada neste projeto.');
    return screen.tests;
  }

  async createScreen(projectId: string, input: CreateScreenDto): Promise<ScreenDto> {
    await this.requireProject(projectId);
    return this.prisma.screen.create({ data: { projectId, ...input }, select: screenFields });
  }

  async createTest(projectId: string, input: CreateTestDto): Promise<TestDto> {
    await this.requireProject(projectId);
    await this.checkReferences(projectId, input.screenId);
    return this.writeWithReferences(() => this.prisma.testCase.create({
      data: { projectId, ...input },
      select: testFields,
    }));
  }

  async createSchedule(projectId: string, input: CreateScheduleDto): Promise<ScheduleDto> {
    await this.requireProject(projectId);
    const { screenIds, ...target } = input;
    if ([target.testId, target.screenId, screenIds].filter(Boolean).length > 1) {
      throw new BadRequestException('Escolha apenas um tipo de alvo.');
    }
    const startAt = new Date(input.startAt);
    if (!Number.isFinite(startAt.getTime()) || startAt.getTime() <= Date.now()) {
      throw new BadRequestException('Informe uma data futura.');
    }
    if (screenIds) {
      const screens = await this.prisma.screen.findMany({
        where: { projectId, id: { in: screenIds } },
        select: { sourceDirectory: true },
      });
      if (screens.length !== screenIds.length) throw new BadRequestException('As telas informadas devem pertencer ao projeto.');
      if (new Set(screens.map(({ sourceDirectory }) => sourceDirectory?.split('/')[2])).size > 1) {
        throw new BadRequestException('Selecione telas de um único módulo por agendamento.');
      }
    } else {
      await this.checkReferences(projectId, target.screenId, target.testId);
    }

    const data = { projectId, ...target, startAt };
    if (!screenIds) {
      return toScheduleDto(await this.writeWithReferences(() => this.prisma.schedule.create({ data, select: scheduleFields })));
    }

    return this.writeWithReferences(() => this.prisma.$transaction(async (tx) => {
      const schedule = await tx.schedule.create({ data, select: { id: true } });
      await tx.scheduleScreen.createMany({
        data: screenIds.map((screenId) => ({ projectId, screenId, scheduleId: schedule.id })),
      });
      return toScheduleDto(await tx.schedule.findUniqueOrThrow({ where: { id: schedule.id }, select: scheduleFields }));
    }));
  }

  async removeTest(projectId: string, id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Lock the referenced row so a concurrent schedule cannot appear before deletion.
      const [test] = await tx.$queryRaw<{ specPath: string | null }[]>`
        SELECT "specPath" FROM "TestCase" WHERE id = ${id}::uuid AND "projectId" = ${projectId}::uuid FOR UPDATE
      `;
      if (!test) throw new NotFoundException('Teste não encontrado neste projeto.');
      if (test.specPath) throw new ConflictException('O catálogo sincroniza este teste com o repositório Cypress.');
      const schedule = await tx.schedule.findFirst({ where: { projectId, testId: id }, select: { id: true } });
      if (schedule) {
        throw new ConflictException('Remova o agendamento deste teste antes de excluí-lo.');
      }
      await tx.testCase.delete({ where: { id } });
    });
  }

  async removeSchedule(projectId: string, id: string): Promise<void> {
    const result = await this.prisma.schedule.deleteMany({ where: { projectId, id } });
    if (result.count === 0) throw new NotFoundException('Agendamento não encontrado neste projeto.');
  }

  private async requireProject(id: string): Promise<void> {
    const exists = await this.prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Projeto não encontrado.');
  }

  private async checkReferences(projectId: string, screenId?: string | null, testId?: string | null): Promise<void> {
    if (screenId && !await this.prisma.screen.findUnique({ where: { id: screenId, projectId }, select: { id: true } })) {
      throw new BadRequestException('A tela informada deve pertencer ao projeto.');
    }
    if (testId && !await this.prisma.testCase.findUnique({ where: { id: testId, projectId }, select: { id: true } })) {
      throw new BadRequestException('O teste informado deve pertencer ao projeto.');
    }
  }

  private async writeWithReferences<T>(write: () => Promise<T>): Promise<T> {
    try {
      return await write();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('O alvo deixou de existir. Atualize a lista e tente novamente.');
      }
      throw error;
    }
  }
}
