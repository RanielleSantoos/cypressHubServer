import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

export class ApiErrorDto {
  @ApiProperty()
  statusCode!: number;

  @ApiProperty({ type: [String] })
  messages!: string[];
}

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse();
    if (exception instanceof HttpException) {
      const details = exception.getResponse();
      const message = typeof details === 'string'
        ? details
        : (details as { message?: string | string[] }).message ?? exception.message;
      response.status(exception.getStatus()).json({
        statusCode: exception.getStatus(),
        messages: Array.isArray(message) ? message : [message],
      } satisfies ApiErrorDto);
      return;
    }

    const databaseUnavailable = exception instanceof Prisma.PrismaClientInitializationError
      || (exception instanceof Prisma.PrismaClientKnownRequestError
        && ['P1001', 'P1002', 'P1017', 'P2024'].includes(exception.code));
    const statusCode = databaseUnavailable ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.INTERNAL_SERVER_ERROR;
    this.logger.error({ event: 'request_failed', statusCode });
    response.status(statusCode).json({
      statusCode,
      messages: [databaseUnavailable ? 'Banco de dados indisponível.' : 'Erro interno.'],
    } satisfies ApiErrorDto);
  }
}
