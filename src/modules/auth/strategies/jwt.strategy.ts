import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtPayload } from '../../../common/interface/user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // ✅ 1. CEK AUTHORIZATION HEADER (PRIORITAS UTAMA)
        ExtractJwt.fromAuthHeaderAsBearerToken(),

        // ✅ 2. CEK COOKIE (FALLBACK)
        (request: Request): string | null => {
          return request?.cookies?.accessToken || null;
        },
      ]),
      secretOrKey: configService.get<string>('jwt.secret') || 'secret_jwt',
      algorithms: ['HS256'],
      ignoreExpiration: false, // ✅ Token expired akan di-reject
    });
  }

  async validate(payload: JwtPayload) {
    // ✅ VALIDASI PAYLOAD
    if (!payload || !payload.userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // ✅ CEK USER DI DATABASE
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
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

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
