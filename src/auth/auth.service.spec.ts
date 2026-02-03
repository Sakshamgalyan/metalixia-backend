import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUser = {
    _id: 'someId',
    role: 'user',
    refreshToken: 'hashedRefreshToken',
    save: jest.fn(),
  };

  const mockTokens = {
    access_token: 'access_token',
    refresh_token: 'refresh_token',
  };

  const mockUserService = {
    createUser: jest.fn(),
    loginUser: jest.fn(),
    updateRefreshToken: jest.fn(),
    findById: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('token'),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'JWT_SECRETKEY') return 'secret';
      if (key === 'JWT_REFRESH_SECRET') return 'refreshSecret';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerUser', () => {
    it('should successfully register a user and return tokens', async () => {
      const registerDto = {
        name: 'Test',
        email: 'test@example.com',
        password: 'password',
        mobileNo: '1234567890',
        post: 'dev',
        role: 'user',
      };
      mockUserService.createUser.mockResolvedValue(mockUser);
      // We need to mock getTokens which is a private method in logic but here accessible
      // Or we let it run and mock jwtService.signAsync which is already mocked
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.registerUser(registerDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(mockUserService.createUser).toHaveBeenCalled();
      expect(mockUserService.updateRefreshToken).toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should successfully login a user and return tokens', async () => {
      const loginDto = { identifier: 'test@example.com', password: 'password' };
      mockUserService.loginUser.mockResolvedValue(mockUser);

      const result = await service.loginUser(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(mockUserService.loginUser).toHaveBeenCalledWith(loginDto);
      expect(mockUserService.updateRefreshToken).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should successfully logout a user', async () => {
      await service.logout('someId');
      expect(mockUserService.updateRefreshToken).toHaveBeenCalledWith(
        'someId',
        null,
      );
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens if refresh token is valid', async () => {
      const refreshToken = 'valid_refresh_token';
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'someId' });
      mockUserService.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.refreshTokens(refreshToken);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(mockUserService.updateRefreshToken).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if token is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error());
      await expect(service.refreshTokens('invalid')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if user not found', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'someId' });
      mockUserService.findById.mockResolvedValue(null);
      await expect(service.refreshTokens('valid')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if token mismatch', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'someId' });
      mockUserService.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshTokens('valid')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
