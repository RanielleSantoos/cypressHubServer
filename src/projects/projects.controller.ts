import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiErrorDto } from '../api-error';
import { CreateProjectDto, ProjectDto } from './project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projetos')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOkResponse({ type: [ProjectDto] })
  list(): Promise<ProjectDto[]> {
    return this.projects.list();
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProjectDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  find(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<ProjectDto> {
    return this.projects.find(id);
  }

  @Post()
  @ApiCreatedResponse({ type: ProjectDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  create(@Body() body: CreateProjectDto): Promise<ProjectDto> {
    return this.projects.create(body);
  }
}
