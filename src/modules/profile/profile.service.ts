import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        about: dto.about,
        gender: dto.gender,
        avatar: dto.avatar,
        profilePhoto: dto.profilePhoto,
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

    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async updatePrivacy(userId: string, dto: UpdatePrivacyDto) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: { userId },
      });
    }

    const updatedSettings = await this.prisma.userSettings.update({
      where: { userId },
      data: {
        showOnlineStatus: dto.showOnlineStatus,
        showLastSeen: dto.showLastSeen,
        showProfilePhoto: dto.showProfilePhoto,
        showAbout: dto.showAbout,
        showStatus: dto.showStatus,
      },
    });

    return updatedSettings;
  }
}
