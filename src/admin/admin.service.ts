import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessCodeService } from '../access-code/access-code.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private accessCodeService: AccessCodeService,
  ) {}

  /**
   * Admin list users & their bound access codes
   */
  async getUsers() {
    return this.prisma.user.findMany({
      include: {
        accessCode: {
          include: {
            album: {
              select: { id: true, title: true, artist: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Admin list access codes
   */
  async getAccessCodes(albumId?: string) {
    return this.prisma.accessCode.findMany({
      where: albumId ? { albumId } : undefined,
      include: {
        album: {
          select: { id: true, title: true, artist: true },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Bulk generate N access codes
   */
  async generateCodes(albumId: string, count: number) {
    return this.accessCodeService.generateBulkCodes(albumId, count);
  }

  /**
   * Reset device binding for an access code
   */
  async resetBinding(id: string) {
    const accessCode = await this.prisma.accessCode.findUnique({
      where: { id },
    });

    if (!accessCode) {
      throw new NotFoundException('Access code not found');
    }

    const updated = await this.prisma.accessCode.update({
      where: { id },
      data: {
        sessionToken: null,
        boundAt: null,
        userId: null, // Clear user association so it can be re-bound cleanly
      },
    });

    return {
      success: true,
      message: `Device binding for code ${updated.code} has been successfully reset.`,
      accessCode: updated,
    };
  }
}
