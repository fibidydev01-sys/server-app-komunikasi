// src/modules/auth/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../common/interface/user.interface';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res() res: Response,
  ): Promise<Response> {
    const user = await this.authService.register(dto);
    const token = this.authService.generateToken(user.id);

    const nodeEnv = this.configService.get<string>('nodeEnv');
    const isProduction = nodeEnv === 'production';

    // Set cookie
    res.cookie('accessToken', token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    });

    // ✅ Only log in development
    if (nodeEnv === 'development') {
      this.logger.debug(`User registered: ${user.email}`);
    }

    return res.status(HttpStatus.CREATED).json({
      message: 'User created & login successfully',
      user,
      accessToken: token,
    });
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response): Promise<Response> {
    const user = await this.authService.login(dto);
    const token = this.authService.generateToken(user.id);

    const nodeEnv = this.configService.get<string>('nodeEnv');
    const isProduction = nodeEnv === 'production';

    // Set cookie
    res.cookie('accessToken', token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    });

    // ✅ Only log in development
    if (nodeEnv === 'development') {
      this.logger.debug(`User logged in: ${user.email}`);
    }

    return res.status(HttpStatus.OK).json({
      message: 'User login successfully',
      user,
      accessToken: token,
    });
  }

  @Post('logout')
  logout(@Res() res: Response): Response {
    res.clearCookie('accessToken', { path: '/' });
    return res.status(HttpStatus.OK).json({
      message: 'User logout successfully',
    });
  }

  @Get('status')
  authStatus(@CurrentUser() user: User): { message: string; user: User } {
    return {
      message: 'Authenticated User',
      user,
    };
  }
}
