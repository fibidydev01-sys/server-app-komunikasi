import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

enum ResponseAction {
  ACCEPT = 'accept',
  REJECT = 'reject',
}

export class RespondRequestDto {
  @IsString()
  @IsNotEmpty()
  requestId: string;

  @IsEnum(ResponseAction)
  @IsNotEmpty()
  action: ResponseAction;
}
