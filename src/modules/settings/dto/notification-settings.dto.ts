import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class NotificationSettingsDto {
  @IsBoolean()
  @IsOptional()
  messageNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  soundEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  vibrationEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  showPreview?: boolean;

  @IsString()
  @IsOptional()
  notificationTone?: string;

  @IsBoolean()
  @IsOptional()
  callNotifications?: boolean;

  @IsString()
  @IsOptional()
  callRingtone?: string;
}
