import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import cookieParser from 'cookie-parser';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let connection: Connection;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    // In e2e with supertest, we deal with headers. Nest's global pipes/interceptors should be set up here if they are in main.ts
    // For simplicity, we assume standard setup.
    await app.init();
    server = app.getHttpServer();
    connection = app.get(getConnectionToken());

    // Ensure DB is clean
    if (connection) {
      await connection.dropDatabase();
    }
  });

  afterAll(async () => {
    // Clean up database if necessary
    if (connection) {
      await connection.dropDatabase();
      await connection.close();
    }
    await app.close();
  });

  const registerDto = {
    name: 'E2E User',
    email: 'e2e@example.com',
    password: 'password123',
    mobileNo: '9876543210',
    post: 'Tester',
    role: 'user',
  };

  let accessToken: string;
  let refreshToken: string;

  it('/auth/register (POST)', async () => {
    const response = await request(server)
      .post('/auth/register')
      .send(registerDto)
      .expect(201);

    expect(response.body).toEqual({ message: 'User registered successfully' });

    // Check cookies
    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith('access_token'))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refresh_token'))).toBe(true);
  });

  it('/auth/login (POST)', async () => {
    const loginDto = {
      identifier: registerDto.email,
      password: registerDto.password,
    };

    const response = await request(server)
      .post('/auth/login')
      .send(loginDto)
      .expect(201);

    expect(response.body).toEqual({ message: 'User logged in successfully' });

    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();

    // Extract tokens for future requests
    const accessTokenCookie = cookies.find((c) => c.startsWith('access_token'));
    const refreshTokenCookie = cookies.find((c) =>
      c.startsWith('refresh_token'),
    );

    if (accessTokenCookie)
      accessToken = accessTokenCookie.split(';')[0].split('=')[1];
    if (refreshTokenCookie)
      refreshToken = refreshTokenCookie.split(';')[0].split('=')[1];
  });

  // Note: Since AuthGuard usually reads from cookies, we need to attach cookies to requests

  it('/auth/profile (GET) - Protected Route', async () => {
    // Need to emulate cookie sending
    // Since cookie-parser middleware is usually in main.ts, ensure it's loaded in AppModule or manually here.
    // But typically AppModule doesn't configure middleware, main.ts does.
    // So we might face issues if cookie-parser is not applied to 'app'.
    // However, usually we can pass Cookie header.

    // Let's assume standard behavior where we just pass the header.
    const response = await request(server)
      .get('/auth/profile')
      .set('Cookie', [`access_token=${accessToken}`])
      .expect(200);

    // Response structure depends on profiling implementation
    // Based on controller spec: { id: ..., role: ... }
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('role');
    expect(response.body.role).toBe(registerDto.role);
  });

  it('/auth/refresh (POST)', async () => {
    const response = await request(server)
      .post('/auth/refresh')
      .set('Cookie', [`refresh_token=${refreshToken}`])
      .expect(201);

    expect(response.body).toEqual({ message: 'Token refreshed successfully' });

    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    // Update tokens
    const accessTokenCookieRefreshed = cookies.find((c) =>
      c.startsWith('access_token'),
    );
    const refreshTokenCookieRefreshed = cookies.find((c) =>
      c.startsWith('refresh_token'),
    );

    if (accessTokenCookieRefreshed)
      accessToken = accessTokenCookieRefreshed.split(';')[0].split('=')[1];
    if (refreshTokenCookieRefreshed)
      refreshToken = refreshTokenCookieRefreshed.split(';')[0].split('=')[1];
  });

  it('/auth/logout (POST)', async () => {
    const response = await request(server)
      .post('/auth/logout')
      .set('Cookie', [`access_token=${accessToken}`])
      .expect(201);

    expect(response.body).toEqual({ message: 'Logged out successfully' });

    const cookies = response.headers['set-cookie'] as unknown as string[];
    // Expect cookies to be cleared (max-age=0 or expires in past)
    expect(cookies.some((c) => c.includes('access_token=;'))).toBe(true);
  });
});
