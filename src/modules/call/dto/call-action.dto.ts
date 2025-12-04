import { IsNotEmpty, IsEnum, IsOptional, IsInt } from 'class-validator';
import { CallStatusEnum } from '../../../common/enums/call.enum';
import { $Enums } from '@prisma/client';

export class CallActionDto {
  @IsEnum(CallStatusEnum)
  @IsNotEmpty()
  status: $Enums.CallStatus;

  @IsInt()
  @IsOptional()
  duration?: number;
}
