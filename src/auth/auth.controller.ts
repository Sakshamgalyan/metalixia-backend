import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  Query,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { RegisterUserDto } from 'src/dto/auth/registerUser.dto';
import { LoginUserDto } from 'src/dto/auth/loginUser.dto';
import { AuthGuard } from './guards/auth.guard';
import { Public } from './decorators/public.decorator';
import { ResetPasswordDto } from 'src/dto/auth/reset-password.dto';
import { SendOtpDto } from 'src/email/dto/send-otp.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UploadedFile, HttpException, HttpStatus } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private setCookies(
    res: Response,
    tokens: { access_token: string; refresh_token: string },
  ) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    const cookieOptions = {
      httpOnly: true,
      sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
      secure: isProduction,
      path: '/',
    };

    res.cookie('access_token', tokens.access_token, {
      ...cookieOptions,
      ...(isProduction && { domain: '.galyan.in' }),
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      ...cookieOptions,
      ...(isProduction && { domain: '.galyan.in' }),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterUserDto, @Res() res: Response) {
    try {
      const tokens = await this.authService.registerUser(registerDto);
      this.setCookies(res, tokens);
      this.logger.log(`User ${registerDto.email} registered successfully`);
      return res.status(201).send({
        message: 'User registered successfully',
        status: 'success',
      });
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginUserDto, @Res() res: Response) {
    try {
      const tokens = await this.authService.loginUser(loginDto);
      this.setCookies(res, tokens);
      this.logger.log(`User ${loginDto.identifier} logged in successfully`);
      return res.status(200).send({
        message: 'User logged in successfully',
        status: 'success',
      });
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Req() req: any, @Res() res: Response) {
    const userId = req.user['sub'];
    await this.authService.logout(userId);

    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const clearOptions = {
      path: '/',
      ...(isProduction && { domain: '.galyan.in' }),
    };

    res.clearCookie('access_token', clearOptions);
    res.clearCookie('refresh_token', clearOptions);

    return res
      .status(200)
      .send({ message: 'Logged out successfully', status: 'success' });
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: any, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh Token not found');
    }
    try {
      const tokens = await this.authService.refreshTokens(refreshToken);
      this.setCookies(res, tokens);
      return res.status(200).send({
        message: 'Token refreshed successfully',
        status: 'success',
      });
    } catch (error) {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      throw error;
    }
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  async profile(@Req() req: any, @Res() res: Response) {
    try {
      const accessToken = req.cookies['access_token'];
      if (!accessToken) {
        const refreshToken = req.cookies['refresh_token'];
        if (refreshToken) {
          const tokens = await this.authService.refreshTokens(refreshToken);
          this.setCookies(res, tokens);
        } else {
          throw new UnauthorizedException('Unauthorized');
        }
      }
      const user = await this.authService.getProfile(req.user.sub);
      return res.status(200).send({
        user,
        message: 'Profile fetched successfully',
        status: 'success',
      });
    } catch (error) {
      this.logger.error(`Profile fetch failed: ${error.message}`, error.stack);
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      throw error;
    }
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: SendOtpDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(AuthGuard)
  @Put('update-profile')
  async updateProfile(
    @Req() req: any,
    @Body() updateProfileDto: any,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.sub;
      await this.authService.updateProfile(userId, updateProfileDto);
      return res.status(200).send({
        message: 'Profile updated successfully',
        status: 'success',
      });
    } catch (error) {
      this.logger.error(`Profile update failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @UseGuards(AuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req: any,
    @Body() changePasswordDto: any,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.sub;

      if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
        throw new UnauthorizedException('Passwords do not match');
      }

      await this.authService.changePassword(
        userId,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      );

      return res.status(200).send({
        message: 'Password changed successfully',
        status: 'success',
      });
    } catch (error) {
      this.logger.error(
        `Password change failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @UseGuards(AuthGuard)
  @Get('search-employees')
  async searchEmployees(
    @Query('search') search: string = '',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Res() res: Response,
  ) {
    try {
      const result = await this.authService.searchEmployees(
        search,
        Number(page),
        Number(limit),
      );
      return res.status(200).send({
        ...result,
        message: 'Employees fetched successfully',
        status: 'success',
      });
    } catch (error) {
      this.logger.error(
        `Employee search failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @UseGuards(AuthGuard)
  @Get('employee/:employeeId')
  async getEmployeeProfile(
    @Param('employeeId') employeeId: string,
    @Res() res: Response,
  ) {
    try {
      const employee = await this.authService.getPublicProfile(employeeId);
      return res.status(200).send({
        employee,
        message: 'Employee profile fetched successfully',
        status: 'success',
      });
    } catch (error) {
      this.logger.error(
        `Employee profile fetch failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @UseGuards(AuthGuard)
  @Post('upload-profile-picture')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'profiles');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req: any, file, cb) => {
          const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extension = extname(file.originalname);
          cb(null, `temp-${uniqueId}${extension}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return cb(
            new HttpException(
              'Only image files are allowed (jpg, jpeg, png, gif, webp)',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadProfilePicture(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      const userId = req.user.sub;

      const user = await this.authService.getProfile(userId);
      const email = user.email.replace(/[@.]/g, '-');
      const employeeId = user.employeeId || 'no-id';
      const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const extension = extname(file.originalname);

      const newFilename = `${email}-${employeeId}-${uniqueId}${extension}`;
      const oldPath = file.path;
      const newPath = join(process.cwd(), 'uploads', 'profiles', newFilename);

      const fs = require('fs');
      fs.renameSync(oldPath, newPath);

      const filename = `/uploads/profiles/${newFilename}`;

      await this.authService.updateProfilePicture(userId, filename);

      return res.status(200).send({
        profilePic: filename,
        message: 'Profile picture uploaded successfully',
        status: 'success',
      });
    } catch (error) {
      this.logger.error(
        `Profile picture upload failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
