import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AuthGuard } from './auth/guards/auth.guard';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { UserService } from './user/user.service';

async function metalixia() {
  const logger = new Logger('Metalixia');
  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.use(cookieParser());
  app.enableCors({
    origin: [
      'http://localhost:2000',
      'https://metalixia-fe.onrender.com',
      "https://metalixia.com",
    ],
    credentials: true,
  });
  const jwtService = app.get(JwtService);
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);
  const userService = app.get(UserService);

  app.useGlobalGuards(new AuthGuard(jwtService, configService, reflector, userService));
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));


  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  logger.log(`Application is running on: Domain:${port || 5000}`);
}
metalixia();