import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const cloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: (configService: ConfigService) => {
    cloudinary.config({
      cloud_name: configService.get<string>('cloudinary.cloudName'),
      api_key: configService.get<string>('cloudinary.apiKey'),
      api_secret: configService.get<string>('cloudinary.apiSecret'),
    });

    return cloudinary;
  },
  inject: [ConfigService],
};

export { cloudinary };
