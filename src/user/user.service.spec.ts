import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './entities/RegisterUser.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let model: any;

  const mockUser = {
    _id: 'someId',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'user',
    refreshToken: 'someRefreshToken',
    save: jest.fn(),
  };

  const mockUserModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    model = module.get(getModelToken(User.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should successfully create a user', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        username: 'test',
        password: 'password',
        mobileNo: '1234567890',
        post: 'dev',
        role: 'user',
      };
      mockUserModel.create.mockResolvedValue(mockUser);

      const result = await service.createUser(registerDto);
      expect(result).toEqual(mockUser);
      expect(mockUserModel.create).toHaveBeenCalledWith(registerDto);
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        username: 'test',
        password: 'password',
        mobileNo: '1234567890',
        post: 'dev',
        role: 'user',
      };
      const error = { code: 11000, keyValue: { email: 'test@example.com' } };
      mockUserModel.create.mockRejectedValue(error);

      await expect(service.createUser(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('loginUser', () => {
    it('should return user if credentials are valid', async () => {
      const loginDto = { identifier: 'test@example.com', password: 'password' };
      mockUserModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.loginUser(loginDto);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto = {
        identifier: 'wrong@example.com',
        password: 'password',
      };
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.loginUser(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const loginDto = { identifier: 'test@example.com', password: 'wrong' };
      mockUserModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.loginUser(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateRefreshToken', () => {
    it('should update the refresh token', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUser);
      await service.updateRefreshToken('someId', 'newToken');
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('someId', {
        refreshToken: 'newToken',
      });
    });
  });

  describe('findById', () => {
    it('should return a user by ID', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);
      const result = await service.findById('someId');
      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith('someId');
    });
  });
});
