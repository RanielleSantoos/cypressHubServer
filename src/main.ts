import { ConsoleLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configure } from './configure';

async function bootstrap(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('Configure DATABASE_URL no ambiente ou no arquivo .env.');
  }
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT deve ser um inteiro entre 1 e 65535.');
  }
  const app = await NestFactory.create(AppModule, { logger: new ConsoleLogger({ json: true }) });
  configure(app, process.env.FRONTEND_ORIGIN ?? 'http://localhost:4200');
  app.enableShutdownHooks();
  await app.listen(port, process.env.HOST ?? '127.0.0.1');
}

bootstrap().catch((error: unknown) => {
  new ConsoleLogger({ json: true }).error({
    event: 'startup_failed',
    message: error instanceof Error ? error.message : 'Falha ao iniciar a API.',
  });
  process.exitCode = 1;
});
