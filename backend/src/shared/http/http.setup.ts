import cookie from '@fastify/cookie';
import type { INestApplication } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';

import { AppConfig } from '@/infra/config';

export function setupApp(
  app: INestApplication,
  appConfig: AppConfig['app'],
): void {
  // Set cookie
  const httpInstance = app.getHttpAdapter().getInstance();
  if (typeof httpInstance.register === 'function') {
    httpInstance.register(cookie, {
      secret: appConfig.cookieSecret,
    });
  }

  // Set versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.use(compression());
}

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('DW API')
    .setDescription('DW API description')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs/swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
