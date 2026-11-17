// Modulul aplicatiei si configurarea OpenAPI, comune pentru server si pentru generare
import 'reflect-metadata';
import { INestApplication, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { MarketController, WatchlistController } from './controllers';
import { ErrorFilter, validationPipe } from './http';

@Module({ controllers: [MarketController, WatchlistController] })
export class AppModule {}

export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.useGlobalPipes(validationPipe);
  app.useGlobalFilters(new ErrorFilter());
  return app;
}

export function buildDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Personal Investment Dashboard API')
    .setDescription('API-ul clientului pentru date de piata si Watchlist-ul privat (Lab 5). Versiunea este in cale (/v1). Erorile au forma { "error": { "code", "message" } }.')
    .setVersion('1.0.0')
    .addServer('https://api.dashboard.example', 'Productie')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token de acces emis de Identity Provider' }, 'bearerAuth')
    .build();
  return SwaggerModule.createDocument(app, config);
}
