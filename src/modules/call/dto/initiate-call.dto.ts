import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { CallTypeEnum } from '../../../common/enums/call.enum';
import { $Enums } from '@prisma/client';

export class InitiateCallDto {
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @IsEnum(CallTypeEnum)
  @IsNotEmpty()
  type: $Enums.CallType;
}
