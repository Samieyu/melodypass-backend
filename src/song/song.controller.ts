import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SongService } from './song.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { SessionGuard } from '../common/guards/session.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller()
export class SongController {
  constructor(private readonly songService: SongService) {}

  // PUBLIC SESSION-GATED AUDIO STREAM URL
  @UseGuards(SessionGuard)
  @Get('songs/:id/stream-url')
  async getStreamUrl(@Param('id') id: string, @Req() req: any) {
    const boundAlbumId = req.accessCode.albumId;
    return this.songService.getStreamUrl(id, boundAlbumId);
  }

  // ADMIN ENDPOINTS
  @UseGuards(JwtAuthGuard)
  @Get('admin/songs')
  async getSongsAdmin(@Query('albumId') albumId?: string) {
    return this.songService.findAllAdmin(albumId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/songs')
  async createSong(@Body() dto: CreateSongDto) {
    return this.songService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/songs/:id')
  async updateSong(@Param('id') id: string, @Body() dto: UpdateSongDto) {
    return this.songService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/songs/:id')
  async deleteSong(@Param('id') id: string) {
    return this.songService.remove(id);
  }
}
