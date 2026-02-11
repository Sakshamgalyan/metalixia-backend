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

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async updateVerificationStatus(userId: string, isVerified: boolean) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { isVerified },
      { new: true },
    );
  }

  async updatePassword(email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.userModel.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true },
    );
  }

  async updateProfile(userId: string, updateProfileDto: any) {
    const updateData: any = {};

    if (updateProfileDto.name) updateData.name = updateProfileDto.name;
    if (updateProfileDto.email) updateData.email = updateProfileDto.email;
    if (updateProfileDto.mobileNo)
      updateData.mobileNo = updateProfileDto.mobileNo;
    if (updateProfileDto.post) updateData.post = updateProfileDto.post;
    if (updateProfileDto.description !== undefined)
      updateData.description = updateProfileDto.description;
    if (updateProfileDto.message !== undefined)
      updateData.message = updateProfileDto.message;

    updateData.updatedOn = new Date();

    return this.userModel.findByIdAndUpdate(userId, updateData, { new: true });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.userModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword, updatedOn: new Date() },
      { new: true },
    );
  }

  async updateProfilePicture(userId: string, filename: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { profilePicture: filename, updatedOn: new Date() },
      { new: true },
    );
  }

  async searchEmployees(
    searchTerm: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const query: any = {};

    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { employeeId: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const employees = await this.userModel
      .find(query)
      .select('name email employeeId post profilePicture message')
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.userModel.countDocuments(query);

    return {
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      data: employees,
    };
  }

  async getPublicProfile(employeeId: string) {
    const employee = await this.userModel
      .findOne({ employeeId })
      .select(
        'name email employeeId mobileNo post profilePicture description message createdOn',
      );

    if (!employee) {
      throw new UnauthorizedException('Employee not found');
    }

    return employee;
  }
}
