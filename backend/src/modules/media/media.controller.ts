// src/modules/media/media.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { MediaService } from './media.service';
import { CreateMediaFileDto } from './dto/media.dto';

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly service: MediaService) {}

  @Get()
  @Permissions(PERMISSIONS.MEDIA.READ)
  findAll(
    @Query('folder') folder: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.findAll(folder, actor);
  }

  @Post()
  @Permissions(PERMISSIONS.MEDIA.CREATE)
  create(
    @Body() dto: CreateMediaFileDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.create(dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.MEDIA.DELETE)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
