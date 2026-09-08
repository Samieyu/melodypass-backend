import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateAlbumDto {
  @IsString()
  @IsNotEmpty({ message: 'Album title is required' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Artist name is required' })
  artist: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;
}
