import { IsOptional, IsString, IsEnum } from 'class-validator';
import { GenderEnum } from '../../../common/enums/user.enum';
import { $Enums } from '@prisma/client';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  about?: string;

  @IsEnum(GenderEnum)
  @IsOptional()
  gender?: $Enums.Gender;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  profilePhoto?: string;
}
