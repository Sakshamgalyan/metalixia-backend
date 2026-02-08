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
import { GetEmployeesDto } from 'src/dto/admin/GetEmployees.dto';
import { UpdateUserDto } from 'src/dto/admin/UpdateUser.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async createUser(registerDto: RegisterUserDto) {
    try {
      const user = await this.userModel.create(registerDto);
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
    const user = await this.userModel.findOne({
      $or: [{ email: loginDto.identifier }, { mobileNo: loginDto.identifier }],
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
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: refreshToken,
    });
  }

  async findById(userId: string) {
    return this.userModel.findById(userId);
  }

  async findByEmployee(getEmployeesDto: GetEmployeesDto) {
    const { page, limit, post, role } = getEmployeesDto;

    const query: any = {};
    if (role && role.length > 0) {
      query.role = { $in: role };
    }
    if (post && post.length > 0) {
      query.post = { $in: post };
    }
    const pageNo = page || 1;
    const size = limit || 10;
    const skip = (pageNo - 1) * size;
    const users = await this.userModel
      .find(query)
      .skip(skip)
      .limit(size)
      .exec();
    const total = await this.userModel.countDocuments(query);

    const data = users.map((user) => {
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNo: user.mobileNo,
        post: user.post,
        role: user.role,
        employeeId: user.employeeId,
      };
    });

    return {
      pagination: {
        total,
        pageNo,
        totalPages: Math.ceil(total / size),
      },
      data: data,
    };
  }

  async updateUser(updateEmployeeDto: UpdateUserDto) {
    const user = await this.userModel.findByIdAndUpdate(updateEmployeeDto._id, {
      name: updateEmployeeDto.name,
      email: updateEmployeeDto.email,
      mobileNo: updateEmployeeDto.mobileNo,
      post: updateEmployeeDto.post,
      role: updateEmployeeDto.role,
      password: updateEmployeeDto.password,
    });
    return user;
  }

  async deleteUser(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    return user;
  }

  async getAllEmployees(employeeIds: string[]) {
    return this.userModel
      .find({ employeeId: { $in: employeeIds } })
      .select('name employeeId');
  }
}
