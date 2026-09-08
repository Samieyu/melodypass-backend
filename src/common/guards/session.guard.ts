import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { safeCompare } from '../utils/crypto-safe.util';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    
    // Extract session token from cookie, header, or bearer token
    const token =
      req.cookies?.session_token ||
      (req.headers['x-session-token'] as string) ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      throw new UnauthorizedException('Access denied: No active album session found. Please enter your access code.');
    }

    // Find AccessCode with sessionToken
    const accessCode = await this.prisma.accessCode.findUnique({
      where: { sessionToken: token },
      include: {
        album: true,
        user: true,
      },
    });

    if (!accessCode || !accessCode.sessionToken) {
      throw new ForbiddenException('Invalid or expired device session. Please re-enter your access code.');
    }

    // Constant-time check
    if (!safeCompare(token, accessCode.sessionToken)) {
      throw new ForbiddenException('Invalid device session token.');
    }

    req.accessCode = accessCode;
    return true;
  }
}
