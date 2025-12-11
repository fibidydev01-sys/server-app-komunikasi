import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  HttpStatus,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationSettingsDto } from './dto/notification-settings.dto';
import type { User } from '../../common/interface/user.interface';

interface SettingsResponse {
  statusCode: number;
  message: string;
  data?: any;
}

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(@CurrentUser() user: User): Promise<SettingsResponse> {
    const settings = await this.settingsService.getSettings(user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Settings retrieved successfully',
      data: settings,
    };
  }

  @Patch('notifications')
  async updateNotificationSettings(
    @CurrentUser() user: User,
    @Body() dto: NotificationSettingsDto,
  ): Promise<SettingsResponse> {
    const settings = await this.settingsService.updateNotificationSettings(
      user.id,
      dto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Notification settings updated successfully',
      data: settings,
    };
  }

  @Get('sessions')
  async getActiveSessions(
    @CurrentUser() user: User,
  ): Promise<SettingsResponse> {
    const sessions = await this.settingsService.getActiveSessions(user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Active sessions retrieved successfully',
      data: sessions,
    };
  }

  @Delete('sessions/:id')
  async revokeSession(
    @CurrentUser() user: User,
    @Param('id') sessionId: string,
  ): Promise<SettingsResponse> {
    const result = await this.settingsService.revokeSession(sessionId, user.id);

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }
}
