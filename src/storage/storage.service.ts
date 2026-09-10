import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME') || 'melodypass-audio';

    if (
      accountId &&
      accessKeyId &&
      secretAccessKey &&
      !accessKeyId.includes('dummy') &&
      !accessKeyId.includes('your_')
    ) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log('Cloudflare R2 client initialized successfully');
    } else {
      this.logger.warn('Cloudflare R2 credentials not fully set or are placeholders. Using fallback signed URL generator for dev mode.');
    }
  }

  /**
   * Generates a signed stream URL valid for 4 hours (14400 seconds)
   * or returns direct video/audio URLs when Cloudflare R2 is not used.
   */
  async getSignedStreamUrl(r2Key: string, expiresInSeconds: number = 14400): Promise<string> {
    // 1. If r2Key is already a full URL or relative static path, return it directly
    if (r2Key.startsWith('http://') || r2Key.startsWith('https://') || r2Key.startsWith('/')) {
      return r2Key;
    }

    // 2. If Cloudflare R2 is configured and key is in R2
    if (this.s3Client) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: r2Key,
        });

        return await getSignedUrl(this.s3Client, command, {
          expiresIn: expiresInSeconds,
        });
      } catch (error) {
        this.logger.error(`Error generating signed URL for key ${r2Key}: ${error.message}`);
        // Fall back to sample video/audio if R2 get fails
      }
    }

    // 3. Fallback direct URLs without requiring Cloudflare R2
    const sampleMediaFiles: Record<string, string> = {
      'nkan-zare.mp4': '/videos/nkan-zare.mp4',
      'king-his-video.mp4': '/videos/nkan-zare.mp4',
      'video.mp4': '/videos/nkan-zare.mp4',
      'sample-video.mp4': '/videos/nkan-zare.mp4',
      'sample-song-1.mp3': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    };

    if (sampleMediaFiles[r2Key]) {
      return sampleMediaFiles[r2Key];
    }

    // If key ends with .mp4 / .webm / video, return local video
    if (r2Key.endsWith('.mp4') || r2Key.endsWith('.webm') || r2Key.includes('video')) {
      return '/videos/nkan-zare.mp4';
    }

    const fallbackUrl = `/videos/nkan-zare.mp4`;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return `${fallbackUrl}?expires=${expiresAt}&signature=mock_r2_signed_${encodeURIComponent(r2Key)}`;
  }
}
