import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { AccessCodeModule } from './access-code/access-code.module';
import { AlbumModule } from './album/album.module';
import { SongModule } from './song/song.module';
import { StorageModule } from './storage/storage.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 60,  // default limit 60 req/min, controllers override specifically
      },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    AccessCodeModule,
    AlbumModule,
    SongModule,
    StorageModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
