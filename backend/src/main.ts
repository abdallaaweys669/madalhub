import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Transform } from 'class-transformer';
import * as express from 'express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { getUploadsDir } from './common/uploads-path';

async function bootstrap() {
  const uploadsDir = getUploadsDir();

  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use('/uploads', express.static(uploadsDir));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 🔥 THIS FIXES EVERYTHING
    }),
  );
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
