import { IsNotEmpty, IsString, IsInt, Min, Max } from 'class-validator';

export class GenerateCodesDto {
  @IsString()
  @IsNotEmpty({ message: 'Album ID is required' })
  albumId: string;

  @IsInt()
  @Min(1, { message: 'Count must be at least 1' })
  @Max(500, { message: 'Maximum 500 codes per bulk request' })
  count: number;
}
