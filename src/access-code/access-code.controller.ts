import { Controller, Post, Body, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AccessCodeService } from './access-code.service';
import { VerifyAccessCodeDto } from './dto/verify-access-code.dto';

@Controller('access')
export class AccessCodeController {
  constructor(private readonly accessCodeService: AccessCodeService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify')
  async verify(
    @Body() dto: VerifyAccessCodeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const existingSessionToken =
      req.cookies?.session_token ||
      (req.headers['x-session-token'] as string) ||
      req.headers.authorization?.replace('Bearer ', '');

    const result = await this.accessCodeService.verifyCode(dto, existingSessionToken);

    // Set httpOnly permanent cookie (1 year duration) for seamless album access
    if (result.sessionToken) {
      res.cookie('session_token', result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }

    return result;
  }
}
