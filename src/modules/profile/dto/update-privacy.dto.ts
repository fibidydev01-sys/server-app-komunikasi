import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import {
  LastSeenPrivacyEnum,
  ProfilePhotoPrivacyEnum,
  AboutPrivacyEnum,
} from '../../../common/enums/settings.enum';
import { StatusPrivacyTypeEnum } from '../../../common/enums/status.enum';
import { $Enums } from '@prisma/client';

export class UpdatePrivacyDto {
  @IsBoolean()
  @IsOptional()
  showOnlineStatus?: boolean;

  @IsEnum(LastSeenPrivacyEnum)
  @IsOptional()
  showLastSeen?: $Enums.LastSeenPrivacy;

  @IsEnum(ProfilePhotoPrivacyEnum)
  @IsOptional()
  showProfilePhoto?: $Enums.ProfilePhotoPrivacy;

  @IsEnum(AboutPrivacyEnum)
  @IsOptional()
  showAbout?: $Enums.AboutPrivacy;

  @IsEnum(StatusPrivacyTypeEnum)
  @IsOptional()
  showStatus?: $Enums.StatusPrivacyType;
}
