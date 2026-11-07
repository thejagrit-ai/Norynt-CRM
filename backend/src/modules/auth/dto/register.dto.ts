// src/modules/auth/dto/register.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'admin@crm.dev' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  // En az 10 karakter; küçük+büyük harf, rakam ve özel karakter.
  @ApiProperty({ example: 'S3cure!Passw0rd', minLength: 10 })
  @IsString()
  @MinLength(10)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/, {
    message:
      'Password must be at least 10 characters with upper and lower case letters, a number and a symbol.',
  })
  password: string;

  @ApiProperty({ example: 'System' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({ example: 'Admin' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  lastName: string;
}
