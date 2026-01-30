import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { RegisterUserDto } from 'src/dto/auth/registerUser.dto';
import { LoginUserDto } from 'src/dto/auth/loginUser.dto';
import { AuthGuard } from './guards/auth.guard';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterUserDto, @Res() res: Response) {
    try {
      const tokens = await this.authService.registerUser(registerDto);
      this.setCookies(res, tokens);
      return res.send({ message: 'User registered successfully' });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginUserDto, @Res() res: Response) {
    try {
      const tokens = await this.authService.loginUser(loginDto);
      this.setCookies(res, tokens);
      return res.send({ message: 'User logged in successfully' });
    } catch (error) {
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Req() req: any, @Res() res: Response) {
    const userId = req.user['sub'];
    await this.authService.logout(userId);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.send({ message: 'Logged out successfully' });
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
      return res.send({ message: 'Token refreshed successfully' });
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
      const user = {
        id: req.user.sub,
        role: req.user.role,
      };
      return res.send(user);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private setCookies(
    res: Response,
    tokens: { access_token: string; refresh_token: string },
  ) {
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: true, // Should be false for localhost if not https, but usually ok with modern browsers on localhost or if careful. User used true.
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
