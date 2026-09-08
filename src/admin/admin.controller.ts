import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { GenerateCodesDto } from './dto/generate-codes.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles('admin', 'support')
  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Roles('admin', 'support')
  @Get('access-codes')
  async getAccessCodes(@Query('albumId') albumId?: string) {
    return this.adminService.getAccessCodes(albumId);
  }

  @Roles('admin')
  @Post('access-codes/generate')
  async generateCodes(@Body() dto: GenerateCodesDto) {
    return this.adminService.generateCodes(dto.albumId, dto.count);
  }

  @Roles('admin', 'support')
  @HttpCode(HttpStatus.OK)
  @Post('access-codes/:id/reset-binding')
  async resetBinding(@Param('id') id: string) {
    return this.adminService.resetBinding(id);
  }
}
