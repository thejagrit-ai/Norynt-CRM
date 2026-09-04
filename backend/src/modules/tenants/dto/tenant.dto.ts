// src/modules/tenants/dto/tenant.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateTenantDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ description: 'Subdomain/slug (a-z0-9-)' })
  @Matches(/^[a-z0-9-]{2,40}$/, {
    message: 'slug yalnız küçük harf/rakam/tire (2-40) olabilir.',
  })
  slug: string;
}

export class AssignUserDto {
  @ApiProperty({ description: "Tenant'a atanacak kullanıcı" })
  @IsUUID('4')
  userId: string;
}
