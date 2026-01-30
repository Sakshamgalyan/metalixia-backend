import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RegisterUserDto } from 'src/dto/auth/registerUser.dto';
import { User } from './entities/RegisterUser.entity';
import { Model } from 'mongoose';
import { LoginUserDto } from 'src/dto/auth/loginUser.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private registerUserModel: Model<User>,
  ) {}

  async createUser(registerDto: RegisterUserDto) {
    try {
      const user = await this.registerUserModel.create(registerDto);
      return user;
    } catch (error: any) {
      if (error.code === 11000) {
        const key = Object.keys(error.keyValue)[0];
        throw new ConflictException(`${key} already exists`);
      }
      throw error;
    }
  }

  async loginUser(loginDto: LoginUserDto) {
    const user = await this.registerUserModel.findOne({
      $or: [
        { email: loginDto.identifier },
        { username: loginDto.identifier },
        { mobileNo: loginDto.identifier },
      ],
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }
    return user;
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    await this.registerUserModel.findByIdAndUpdate(userId, {
      refreshToken: refreshToken,
    });
  }

  async findById(userId: string) {
    return this.registerUserModel.findById(userId);
  }
}
