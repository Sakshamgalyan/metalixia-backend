import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AuthGuard } from './auth/guards/auth.guard';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const jwtService = app.get(JwtService);
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  app.useGlobalGuards(new AuthGuard(jwtService, configService, reflector));
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({
    origin: ['http://localhost:3000', 'https://metalixia-frontend.vercel.app'],
    credentials: true,
  });

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  logger.log(`Application is running on: Domain:${port}`);
}
bootstrap();