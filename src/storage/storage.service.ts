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
   */
  async getSignedStreamUrl(r2Key: string, expiresInSeconds: number = 14400): Promise<string> {
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
        throw error;
      }
    }

    // Fallback URL for development or testing audio playback
    const sampleAudioFiles: Record<string, string> = {
      'sample-song-1.mp3': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      'sample-song-2.mp3': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      'sample-song-3.mp3': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    };

    const fallbackUrl = sampleAudioFiles[r2Key] || `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3`;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return `${fallbackUrl}?expires=${expiresAt}&signature=mock_r2_signed_${encodeURIComponent(r2Key)}`;
  }
}
