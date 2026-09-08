import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyAccessCodeDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'Access code is required' })
  @Length(6, 6, { message: 'Access code must be exactly 6 characters' })
  @Matches(/^[2-9A-HJ-NP-Z]{6}$/i, { message: 'Invalid code format. Enter a 6-character code.' })
  code: string;
}
