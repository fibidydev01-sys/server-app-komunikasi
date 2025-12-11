import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { cloudinaryProvider } from '../../config/cloudinary.config';

@Module({
  controllers: [MediaController],
  providers: [MediaService, cloudinaryProvider],
  exports: [MediaService],
})
export class MediaModule {}
