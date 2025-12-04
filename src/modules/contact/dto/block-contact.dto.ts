import { IsNotEmpty, IsString } from 'class-validator';

export class BlockContactDto {
  @IsString()
  @IsNotEmpty()
  contactId: string;
}
