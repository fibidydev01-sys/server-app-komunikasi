import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpStatus,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UploadMediaDto } from './dto/upload-media.dto';
import type { User } from '../../common/interface/user.interface';
import type { Media } from '../../common/interface/media.interface';

interface MediaResponse {
  statusCode: number;
  message: string;
  data?: Media | Media[];
}

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  async uploadMedia(
    @CurrentUser() user: User,
    @Body() dto: UploadMediaDto,
  ): Promise<MediaResponse> {
    const media = await this.mediaService.uploadMedia(user.id, dto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Media uploaded successfully',
      data: media,
    };
  }

  @Get(':id')
  async getMediaById(@Param('id') mediaId: string): Promise<MediaResponse> {
    const media = await this.mediaService.getMediaById(mediaId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Media retrieved successfully',
      data: media,
    };
  }

  @Delete(':id')
  async deleteMedia(
    @CurrentUser() user: User,
    @Param('id') mediaId: string,
  ): Promise<MediaResponse> {
    const result = await this.mediaService.deleteMedia(mediaId, user.id);

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Get('user/all')
  async getUserMedia(@CurrentUser() user: User): Promise<MediaResponse> {
    const media = await this.mediaService.getUserMedia(user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'User media retrieved successfully',
      data: media,
    };
  }
}
