import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Recurrence } from '@prisma/client';
import { Transform } from 'class-transformer';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength, ValidateIf } from 'class-validator';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

class NameDto {
  @ApiProperty({ minLength: 1, maxLength: 120 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}

export class CreateScreenDto extends NameDto {
  @ApiProperty({ example: '/login', maxLength: 300 })
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  @Matches(/^\/(?!\/)[^\s\\]*$/, { message: 'Informe uma rota que comece com /.' })
  route!: string;
}

export class CreateTestDto extends NameDto {
  @ApiPropertyOptional({ format: 'uuid', type: String, nullable: true })
  @IsOptional()
  @IsUUID('4')
  screenId?: string | null;
}

export class CreateScheduleDto {
  @ApiProperty({ format: 'date-time' })
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:\d{2})$/)
  startAt!: string;

  @ApiProperty({ enum: Recurrence })
  @IsEnum(Recurrence)
  recurrence!: Recurrence;

  @ApiPropertyOptional({ format: 'uuid', type: String, nullable: true })
  @IsOptional()
  @IsUUID('4')
  screenId?: string | null;

  @ApiPropertyOptional({ type: 'array', items: { type: 'string', format: 'uuid' }, minItems: 1, uniqueItems: true })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  screenIds?: string[];

  @ApiPropertyOptional({ format: 'uuid', type: String, nullable: true })
  @IsOptional()
  @IsUUID('4')
  testId?: string | null;
}

export class ScreenDto extends NameDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, nullable: true })
  route!: string | null;

  @ApiProperty({ type: String, nullable: true })
  sourceDirectory!: string | null;
}

export class TestDto extends NameDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid', type: String, nullable: true })
  screenId!: string | null;

  @ApiProperty({ type: String, nullable: true })
  specPath!: string | null;

  @ApiProperty()
  specAvailable!: boolean;
}

export class ScheduleDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  startAt!: Date;

  @ApiProperty({ enum: Recurrence })
  recurrence!: Recurrence;

  @ApiProperty({ format: 'uuid', type: String, nullable: true })
  screenId!: string | null;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'uuid' } })
  screenIds!: string[];

  @ApiProperty({ format: 'uuid', type: String, nullable: true })
  testId!: string | null;
}

export class WorkspaceDto {
  @ApiProperty({ type: [ScreenDto] })
  screens!: ScreenDto[];

  @ApiProperty({ type: [TestDto] })
  tests!: TestDto[];

  @ApiProperty({ type: [ScheduleDto] })
  schedules!: ScheduleDto[];
}
