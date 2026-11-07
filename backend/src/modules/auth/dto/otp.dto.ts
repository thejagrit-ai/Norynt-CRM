import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

const normEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const STRONG = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;
const STRONG_MSG =
  'Password must be at least 10 characters with upper and lower case letters, a number and a symbol.';

export class EmailOnlyDto {
  @ApiProperty({ example: 'name@company.com' })
  @Transform(normEmail)
  @IsEmail()
  email: string;
}

export class VerifyEmailDto extends EmailOnlyDto {
  @ApiProperty({ example: '482913' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Enter the 6-digit code from your email.' })
  otp: string;
}

export class ResetPasswordDto extends VerifyEmailDto {
  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10, { message: STRONG_MSG })
  @Matches(STRONG, { message: STRONG_MSG })
  newPassword: string;
}
