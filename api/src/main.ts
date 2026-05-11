import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // DTO class-validator : ignore les champs non décorés, transforme les types (query/body)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS : origines explicites en prod ; en dev, autoriser localhost ET 127.0.0.1 (le navigateur les traite différemment).
  const fromEnv = process.env.CORS_ORIGIN?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const devFallback =
    process.env.NODE_ENV !== 'production'
      ? ['http://localhost:5173', 'http://127.0.0.1:5173']
      : [];
  const origin =
    fromEnv?.length && process.env.NODE_ENV === 'production'
      ? fromEnv
      : fromEnv?.length
        ? [...new Set([...fromEnv, ...devFallback])]
        : devFallback.length
          ? devFallback
          : true;

  app.enableCors({
    origin,
    credentials: true,
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
}
bootstrap();
