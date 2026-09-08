import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AlbumService } from './album.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { SessionGuard } from '../common/guards/session.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller()
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  // PUBLIC SESSION-GATED ENDPOINT
  @UseGuards(SessionGuard)
  @Get('albums/:id')
  async getAlbumForUser(@Param('id') id: string, @Req() req: any) {
    const boundAlbumId = req.accessCode.albumId;
    return this.albumService.getAlbumForSession(id, boundAlbumId);
  }

  // ADMIN ENDPOINTS
  @UseGuards(JwtAuthGuard)
  @Get('admin/albums')
  async getAlbumsAdmin() {
    return this.albumService.findAllAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/albums/:id')
  async getAlbumAdmin(@Param('id') id: string) {
    return this.albumService.findOneAdmin(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/albums')
  async createAlbum(@Body() dto: CreateAlbumDto) {
    return this.albumService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/albums/:id')
  async updateAlbum(@Param('id') id: string, @Body() dto: UpdateAlbumDto) {
    return this.albumService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/albums/:id')
  async deleteAlbum(@Param('id') id: string) {
    return this.albumService.remove(id);
  }
}
