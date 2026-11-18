import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiErrorDto } from '../api-error';
import { CreateScheduleDto, CreateScreenDto, CreateTestDto, ScheduleDto, ScreenDto, TestDto, WorkspaceDto } from './workspace.dto';
import { WorkspaceService } from './workspace.service';

const uuid = new ParseUUIDPipe({ version: '4' });

@ApiTags('Área de trabalho')
@ApiParam({ name: 'projectId', format: 'uuid' })
@ApiBadRequestResponse({ type: ApiErrorDto })
@ApiNotFoundResponse({ type: ApiErrorDto })
@Controller('projects/:projectId/workspace')
export class WorkspaceController {
  constructor(private readonly workspace: WorkspaceService) {}

  @Get()
  @ApiOkResponse({ type: WorkspaceDto })
  get(@Param('projectId', uuid) projectId: string): Promise<WorkspaceDto> {
    return this.workspace.get(projectId);
  }

  @Get('screens')
  @ApiOkResponse({ type: [ScreenDto] })
  listScreens(@Param('projectId', uuid) projectId: string): Promise<ScreenDto[]> {
    return this.workspace.listScreens(projectId);
  }

  @Get('screens/:screenId/tests')
  @ApiParam({ name: 'screenId', format: 'uuid' })
  @ApiOkResponse({ type: [TestDto] })
  listScreenTests(@Param('projectId', uuid) projectId: string, @Param('screenId', uuid) screenId: string): Promise<TestDto[]> {
    return this.workspace.listScreenTests(projectId, screenId);
  }

  @Post('screens')
  @ApiCreatedResponse({ type: ScreenDto })
  createScreen(@Param('projectId', uuid) projectId: string, @Body() input: CreateScreenDto): Promise<ScreenDto> {
    return this.workspace.createScreen(projectId, input);
  }

  @Post('tests')
  @ApiCreatedResponse({ type: TestDto })
  createTest(@Param('projectId', uuid) projectId: string, @Body() input: CreateTestDto): Promise<TestDto> {
    return this.workspace.createTest(projectId, input);
  }

  @Post('schedules')
  @ApiCreatedResponse({ type: ScheduleDto })
  createSchedule(@Param('projectId', uuid) projectId: string, @Body() input: CreateScheduleDto): Promise<ScheduleDto> {
    return this.workspace.createSchedule(projectId, input);
  }

  @Delete('tests/:id')
  @HttpCode(204)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiConflictResponse({ type: ApiErrorDto })
  removeTest(@Param('projectId', uuid) projectId: string, @Param('id', uuid) id: string): Promise<void> {
    return this.workspace.removeTest(projectId, id);
  }

  @Delete('schedules/:id')
  @HttpCode(204)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  removeSchedule(@Param('projectId', uuid) projectId: string, @Param('id', uuid) id: string): Promise<void> {
    return this.workspace.removeSchedule(projectId, id);
  }
}
