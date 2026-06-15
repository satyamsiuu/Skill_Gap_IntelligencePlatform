import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { StoragePort } from './storage.port';

@Injectable()
export class CloudinaryAdapter implements StoragePort {
  private readonly logger = new Logger(CloudinaryAdapter.name);

  constructor(private readonly config: ConfigService) {
    const cloudinaryUrl = this.config.get<string>('CLOUDINARY_URL');
    if (cloudinaryUrl) {
      // Cloudinary SDK automatically configures itself if CLOUDINARY_URL is present in env.
      // But we explicitly configure it here if we want to parse it manually.
      // For now, it works automatically.
    } else {
      this.logger.warn('CLOUDINARY_URL is not set. Storage uploads will fail.');
    }
  }

  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    folder: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `sgip/${folder}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary upload failed: ${error.message}`);
            return reject(
              new Error(error.message || 'Cloudinary upload failed'),
            );
          }
          if (!result) {
            return reject(new Error('No result returned from Cloudinary'));
          }
          resolve(result.secure_url);
        },
      );

      Readable.from(buffer).pipe(uploadStream);
    });
  }

  async deleteFile(storageKey: string): Promise<void> {
    // storageKey from Cloudinary is often the secure_url.
    // We need to extract the public_id to delete it.
    // e.g. https://res.cloudinary.com/demo/image/upload/v1234567/sgip/avatars/abcd.jpg
    const match = storageKey.match(/\/v\d+\/(.+)\.[a-zA-Z0-9]+$/);
    if (!match) {
      this.logger.warn(`Could not extract public_id from URL: ${storageKey}`);
      return;
    }
    const publicId = match[1];

    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      this.logger.error(`Failed to delete from Cloudinary: ${err}`);
      throw err;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getSignedUrl(storageKey: string): Promise<string> {
    // Cloudinary supports signed URLs for authenticated resources, but for MVP
    // we are making files mostly unauthenticated-delivery but obscure URLs.
    return storageKey;
  }
}
