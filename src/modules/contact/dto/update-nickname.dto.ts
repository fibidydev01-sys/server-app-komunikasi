import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UpdateNicknameDto {
  @IsString()
  @IsNotEmpty()
  contactId: string;

  @IsString()
  @IsOptional()
  nickname?: string;
}
