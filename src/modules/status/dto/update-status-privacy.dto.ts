import {
  IsEnum,
  IsOptional,
  IsArray,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { StatusPrivacyTypeEnum } from '../../../common/enums/status.enum';
import { $Enums } from '@prisma/client';

export class UpdateStatusPrivacyDto {
  @IsEnum(StatusPrivacyTypeEnum)
  @IsNotEmpty()
  type: $Enums.StatusPrivacyType;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  exceptUserIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  onlyUserIds?: string[];
}
