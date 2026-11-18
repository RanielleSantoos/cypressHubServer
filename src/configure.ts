import { INestApplication, ValidationPipe, VERSION_NEUTRAL, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ApiErrorDto, ApiErrorFilter } from './api-error';

export function configure(app: INestApplication, frontendOrigin: string): void {
  const origin = new URL(frontendOrigin);
  if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== frontendOrigin) {
    throw new Error('FRONTEND_ORIGIN deve ser uma origem HTTP(S) sem barra final.');
  }

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: [VERSION_NEUTRAL, '1'] });
  app.enableCors({ origin: [frontendOrigin], methods: ['GET', 'POST', 'DELETE'], allowedHeaders: ['Content-Type'] });
  app.use(helmet({
    contentSecurityPolicy: {
      directives: { scriptSrc: ["'self'", "'unsafe-inline'"], upgradeInsecureRequests: null },
    },
  }));
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new ApiErrorFilter());

  const options = new DocumentBuilder().setTitle('Cypress Hub').setVersion('1.0.0').build();
  SwaggerModule.setup('api/docs', app, () => SwaggerModule.createDocument(app, options, {
    extraModels: [ApiErrorDto],
  }));
}
