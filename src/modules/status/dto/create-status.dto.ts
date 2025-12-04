import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsHexColor,
} from 'class-validator';
import { StatusTypeEnum } from '../../../common/enums/status.enum';
import { $Enums } from '@prisma/client';

export class CreateStatusDto {
  @IsEnum(StatusTypeEnum)
  @IsNotEmpty()
  type: $Enums.StatusType;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsHexColor()
  @IsOptional()
  backgroundColor?: string;
}
