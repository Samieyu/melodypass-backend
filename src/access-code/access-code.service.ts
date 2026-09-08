import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerifyAccessCodeDto } from './dto/verify-access-code.dto';
import { safeCompare, generateSessionToken, generateAccessCode } from '../common/utils/crypto-safe.util';

@Injectable()
export class AccessCodeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Verify and bind access code to the requesting device session
   */
  async verifyCode(dto: VerifyAccessCodeDto, existingSessionToken?: string) {
    const cleanCode = dto.code.trim().toUpperCase();

    const accessCode = await this.prisma.accessCode.findUnique({
      where: { code: cleanCode },
      include: {
        album: true,
        user: true,
      },
    });

    if (!accessCode) {
      throw new NotFoundException('Invalid access code. Please check your 6-character code and try again.');
    }

    // CASE 1: Code is UNBOUND (First activation on a new device)
    if (!accessCode.sessionToken || !accessCode.userId) {
      const sessionToken = generateSessionToken();

      // Create User record and bind AccessCode atomically
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: dto.name.trim(),
            phone: dto.phone.trim(),
          },
        });

        const updatedCode = await tx.accessCode.update({
          where: { id: accessCode.id },
          data: {
            userId: user.id,
            sessionToken: sessionToken,
            boundAt: new Date(),
          },
          include: {
            album: true,
          },
        });

        return { user, updatedCode };
      });

      return {
        success: true,
        status: 'bound',
        albumId: result.updatedCode.albumId,
        albumTitle: result.updatedCode.album.title,
        sessionToken,
        message: 'Access code successfully bound to this device!',
      };
    }

    // CASE 2: Code is ALREADY BOUND to a device
    // Check if the current device presenting existingSessionToken matches the DB sessionToken using constant-time comparison
    if (existingSessionToken && safeCompare(existingSessionToken, accessCode.sessionToken)) {
      return {
        success: true,
        status: 're-authenticated',
        albumId: accessCode.albumId,
        albumTitle: accessCode.album.title,
        sessionToken: accessCode.sessionToken,
        message: 'Welcome back! Device verified.',
      };
    }

    // If session tokens do NOT match (or candidate device had no token) -> reject access
    throw new ForbiddenException(
      'This access code is already in use on another device. Each code grants permanent access to a single device only.',
    );
  }

  /**
   * Helper to validate if a sessionToken matches an active album binding
   */
  async validateSessionForAlbum(sessionToken: string, albumId: string) {
    if (!sessionToken) return false;

    const accessCode = await this.prisma.accessCode.findFirst({
      where: {
        albumId,
        sessionToken: { not: null },
      },
    });

    if (!accessCode || !accessCode.sessionToken) return false;

    return safeCompare(sessionToken, accessCode.sessionToken);
  }

  /**
   * Bulk generate access codes for an album (Admin only)
   */
  async generateBulkCodes(albumId: string, count: number = 10) {
    const album = await this.prisma.album.findUnique({ where: { id: albumId } });
    if (!album) {
      throw new NotFoundException('Album not found');
    }

    const createdCodes: string[] = [];
    let attempts = 0;
    const maxAttempts = count * 5;

    while (createdCodes.length < count && attempts < maxAttempts) {
      attempts++;
      const candidate = generateAccessCode();
      try {
        await this.prisma.accessCode.create({
          data: {
            code: candidate,
            albumId: album.id,
          },
        });
        createdCodes.push(candidate);
      } catch (err) {
        // Collision retry
      }
    }

    return {
      success: true,
      count: createdCodes.length,
      codes: createdCodes,
    };
  }
}
