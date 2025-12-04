import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class UploadMediaDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsInt()
  @IsNotEmpty()
  size: number;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsInt()
  @IsOptional()
  width?: number;

  @IsInt()
  @IsOptional()
  height?: number;

  @IsInt()
  @IsOptional()
  duration?: number;
}
