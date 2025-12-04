import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import type { Media } from '../../common/interface/media.interface';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('CLOUDINARY') private readonly cloudinaryConfig: any,
  ) {}

  // Extract public_id from Cloudinary URL
  private getPublicIdFromUrl(url: string): string | null {
    try {
      // Example URL: https://res.cloudinary.com/dfaavyfbq/image/upload/v1234567890/chat-app-media/filename.jpg
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Failed to extract public_id from URL:', error);
      return null;
    }
  }

  // Upload media
  async uploadMedia(userId: string, dto: UploadMediaDto): Promise<Media> {
    const media = await this.prisma.media.create({
      data: {
        userId,
        filename: dto.filename,
        originalName: dto.filename,
        mimeType: dto.mimeType,
        size: dto.size,
        url: dto.url,
        thumbnailUrl: dto.thumbnailUrl,
        width: dto.width,
        height: dto.height,
        duration: dto.duration,
      },
    });

    return media;
  }

  // Get media by ID
  async getMediaById(mediaId: string): Promise<Media> {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return media;
  }

  // Delete media (with Cloudinary cleanup)
  async deleteMedia(
    mediaId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    if (media.userId !== userId) {
      throw new ForbiddenException('You can only delete your own media');
    }

    // Delete from Cloudinary
    const publicId = this.getPublicIdFromUrl(media.url);
    if (publicId) {
      try {
        // Determine resource type based on MIME type
        const resourceType = media.mimeType.startsWith('video/')
          ? 'video'
          : 'image';

        await cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
        });
      } catch (error) {
        console.error('Failed to delete from Cloudinary:', error);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Delete from database
    await this.prisma.media.delete({
      where: { id: mediaId },
    });

    return { message: 'Media deleted successfully' };
  }

  // Get user media
  async getUserMedia(userId: string): Promise<Media[]> {
    const media = await this.prisma.media.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return media;
  }
}
