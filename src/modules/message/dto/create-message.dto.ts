import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(['text', 'image', 'file'])
  @IsOptional()
  type?: string;
}
