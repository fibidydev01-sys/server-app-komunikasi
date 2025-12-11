// src/modules/auth/auth.service.ts

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        avatar: dto.avatar,
        username: dto.username,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        avatar: true,
        about: true,
        gender: true,
        profilePhoto: true,
        lastSeen: true,
        isOnline: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`User registered successfully: ${user.id}`);

    return user;
  }

  async login(dto: LoginDto) {
    const userFromDB = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // ✅ Generic error message - don't reveal if email exists
    if (!userFromDB) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      userFromDB.password,
    );

    // ✅ Generic error message
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = userFromDB;

    this.logger.log(`User logged in successfully: ${userWithoutPassword.id}`);

    return userWithoutPassword;
  }

  generateToken(userId: string): string {
    return this.jwtService.sign({ userId });
  }
}
