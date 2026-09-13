// src/modules/users/users.controller.ts
// SADECE HTTP: DTO + yetki dekoratörleri + servis çağrısı. İş mantığı YOK.
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions(PERMISSIONS.USER.CREATE)
  @ApiOperation({ summary: 'Kullanıcı oluştur' })
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.create(dto, actor);
  }

  @Get()
  @Permissions(PERMISSIONS.USER.READ)
  @ApiOperation({ summary: 'Kullanıcıları listele (sayfalı)' })
  findAll(@Query() q: PaginationDto) {
    return this.usersService.findAll(q);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.USER.READ)
  @ApiOperation({ summary: 'Tek kullanıcı' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.USER.UPDATE)
  @ApiOperation({ summary: 'Profil güncelle' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/roles')
  @Permissions(PERMISSIONS.ROLE.ASSIGN)
  @ApiOperation({ summary: 'Kullanıcının rollerini ata (tam liste)' })
  assignRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRolesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.assignRoles(id, dto.roleIds, actor);
  }

  @Patch(':id/status')
  @Permissions(PERMISSIONS.USER.UPDATE)
  @ApiOperation({ summary: 'Kullanıcıyı aktif/pasif yap' })
  setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.setStatus(id, dto.isActive, actor);
  }

  @Patch(':id/block')
  @Permissions(PERMISSIONS.USER.UPDATE)
  @ApiOperation({ summary: '1-tık kullanıcı engelini aç/kapat (block/unblock)' })
  blockUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isBlocked') isBlocked: boolean,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.setStatus(id, !Boolean(isBlocked), actor);
  }

  @Post(':id/reset-password')
  @Permissions(PERMISSIONS.USER.UPDATE)
  @ApiOperation({ summary: 'Kullanıcı şifresini zorunlu sıfırla' })
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('password') password?: string,
    @CurrentUser() actor?: AuthenticatedUser,
  ) {
    return this.usersService.resetPassword(id, password, actor);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.USER.DELETE)
  @ApiOperation({ summary: 'Kullanıcıyı pasifleştir (soft delete)' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.remove(id, actor);
  }
}
