import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockTokens = {
    access_token: 'access_token',
    refresh_token: 'refresh_token',
  };

  const mockAuthService = {
    registerUser: jest.fn(),
    loginUser: jest.fn(),
    logout: jest.fn(),
    refreshTokens: jest.fn(),
  };

  const mockResponse = {
    cookie: jest.fn(),
    send: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register user and set cookies', async () => {
      const registerDto = {
        name: 'Test',
        email: 'test@example.com',
        password: 'password',
        mobileNo: '1234567890',
        post: 'dev',
        role: 'user',
      };
      mockAuthService.registerUser.mockResolvedValue(mockTokens);

      await controller.register(registerDto, mockResponse);

      expect(mockAuthService.registerUser).toHaveBeenCalledWith(registerDto);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2); // accessToken and refreshToken
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user and set cookies', async () => {
      const loginDto = { identifier: 'test@example.com', password: 'password' };
      mockAuthService.loginUser.mockResolvedValue(mockTokens);

      await controller.login(loginDto, mockResponse);

      expect(mockAuthService.loginUser).toHaveBeenCalledWith(loginDto);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout user and clear cookies', async () => {
      const req = { user: { sub: 'someId' } };
      await controller.logout(req, mockResponse);

      expect(mockAuthService.logout).toHaveBeenCalledWith('someId');
      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should refresh tokens and set new cookies', async () => {
      const req = { cookies: { refresh_token: 'valid_refresh' } };
      mockAuthService.refreshTokens.mockResolvedValue(mockTokens);

      await controller.refresh(req, mockResponse);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(
        'valid_refresh',
      );
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if no refresh token provided', async () => {
      const req = { cookies: {} };
      await expect(controller.refresh(req, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should clear cookies and throw error if refresh fails', async () => {
      const req = { cookies: { refresh_token: 'invalid_token' } };
      mockAuthService.refreshTokens.mockRejectedValue(new Error());

      await expect(controller.refresh(req, mockResponse)).rejects.toThrow();
      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('profile', () => {
    it('should return user profile', async () => {
      const req = { user: { sub: 'someId', role: 'user' } };
      await controller.profile(req, mockResponse);
      expect(mockResponse.send).toHaveBeenCalledWith({
        id: 'someId',
        role: 'user',
      });
    });
  });
});
