import { Controller, Get, Patch, Post, Body, HttpStatus } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import type { User } from '@prisma/client';

interface ProfileResponse {
  statusCode: number;
  message: string;
  data?: any;
}

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@CurrentUser() user: User): Promise<ProfileResponse> {
    const profile = await this.profileService.getProfile(user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Profile retrieved successfully',
      data: profile,
    };
  }

  @Patch()
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    const profile = await this.profileService.updateProfile(user.id, dto);

    return {
      statusCode: HttpStatus.OK,
      message: 'Profile updated successfully',
      data: profile,
    };
  }

  @Post('change-password')
  async changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ): Promise<ProfileResponse> {
    const result = await this.profileService.changePassword(user.id, dto);

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Patch('privacy')
  async updatePrivacy(
    @CurrentUser() user: User,
    @Body() dto: UpdatePrivacyDto,
  ): Promise<ProfileResponse> {
    const settings = await this.profileService.updatePrivacy(user.id, dto);

    return {
      statusCode: HttpStatus.OK,
      message: 'Privacy settings updated successfully',
      data: settings,
    };
  }
}
