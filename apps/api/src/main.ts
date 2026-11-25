import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AMBIENTE } from './common/ambiente';

async function iniciar() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const documento = new DocumentBuilder().setTitle('LabReserva API').setVersion('1.0').build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, documento));
  app.enableShutdownHooks();
  await app.listen(AMBIENTE.porta, '0.0.0.0');
}

iniciar();
