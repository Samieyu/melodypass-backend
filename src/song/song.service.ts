import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';

@Injectable()
export class SongService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  /**
   * Generates a 4-hour signed stream URL for a song
   */
  async getStreamUrl(id: string, boundAlbumId: string) {
    const song = await this.prisma.song.findUnique({
      where: { id },
    });

    if (!song) {
      throw new NotFoundException('Song not found');
    }

    if (song.albumId !== boundAlbumId) {
      throw new ForbiddenException('Your active access code does not grant access to stream this song.');
    }

    const ttl = 14400; // 4 hours in seconds
    const streamUrl = await this.storageService.getSignedStreamUrl(song.r2Key, ttl);

    return {
      songId: song.id,
      title: song.title,
      trackNo: song.trackNo,
      duration: song.duration,
      streamUrl,
      expiresInSeconds: ttl,
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
    };
  }

  /**
   * Admin list all songs
   */
  async findAllAdmin(albumId?: string) {
    return this.prisma.song.findMany({
      where: albumId ? { albumId } : undefined,
      include: {
        album: {
          select: { title: true, artist: true },
        },
      },
      orderBy: [{ albumId: 'asc' }, { trackNo: 'asc' }],
    });
  }

  /**
   * Admin create song
   */
  async create(dto: CreateSongDto) {
    const album = await this.prisma.album.findUnique({ where: { id: dto.albumId } });
    if (!album) {
      throw new NotFoundException('Specified album does not exist');
    }

    return this.prisma.song.create({
      data: dto,
    });
  }

  /**
   * Admin update song
   */
  async update(id: string, dto: UpdateSongDto) {
    const song = await this.prisma.song.findUnique({ where: { id } });
    if (!song) {
      throw new NotFoundException('Song not found');
    }

    return this.prisma.song.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Admin delete song
   */
  async remove(id: string) {
    const song = await this.prisma.song.findUnique({ where: { id } });
    if (!song) {
      throw new NotFoundException('Song not found');
    }

    return this.prisma.song.delete({
      where: { id },
    });
  }
}
