import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';

@Injectable()
export class AlbumService {
  constructor(private prisma: PrismaService) {}

  /**
   * Public album metadata for verified session
   */
  async getAlbumForSession(id: string, boundAlbumId: string) {
    if (boundAlbumId !== id) {
      throw new ForbiddenException('Your active access code is not authorized for this album.');
    }

    const album = await this.prisma.album.findUnique({
      where: { id },
      include: {
        songs: {
          orderBy: { trackNo: 'asc' },
          select: {
            id: true,
            title: true,
            duration: true,
            trackNo: true,
            albumId: true,
            // r2Key excluded for security!
          },
        },
      },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    return album;
  }

  /**
   * Admin list all albums
   */
  async findAllAdmin() {
    return this.prisma.album.findMany({
      include: {
        _count: {
          select: {
            songs: true,
            accessCodes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Admin get album detail
   */
  async findOneAdmin(id: string) {
    const album = await this.prisma.album.findUnique({
      where: { id },
      include: {
        songs: {
          orderBy: { trackNo: 'asc' },
        },
        accessCodes: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            user: true,
          },
        },
      },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    return album;
  }

  /**
   * Admin create album
   */
  async create(dto: CreateAlbumDto) {
    return this.prisma.album.create({
      data: dto,
    });
  }

  /**
   * Admin update album
   */
  async update(id: string, dto: UpdateAlbumDto) {
    await this.findOneAdmin(id);
    return this.prisma.album.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Admin delete album
   */
  async remove(id: string) {
    await this.findOneAdmin(id);
    return this.prisma.album.delete({
      where: { id },
    });
  }
}
