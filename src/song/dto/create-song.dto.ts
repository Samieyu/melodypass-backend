import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateSongDto {
  @IsString()
  @IsNotEmpty({ message: 'Song title is required' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'R2 Object Key is required' })
  r2Key: string;

  @IsString()
  @IsNotEmpty({ message: 'Album ID is required' })
  albumId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  trackNo?: number;
}
