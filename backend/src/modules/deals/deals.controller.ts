// src/modules/deals/deals.controller.ts
// SADECE HTTP: DTO + yetki dekoratörleri + servis çağrısı.
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
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { MoveDealDto } from './dto/move-deal.dto';
import { AssignDealDto } from './dto/assign-deal.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryDealDto } from './dto/query-deal.dto';

@ApiTags('deals')
@ApiBearerAuth()
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  // 'board' statik yolu, ':id' parametresinden ÖNCE tanımlanır.
  @Get('board')
  @Permissions(PERMISSIONS.DEAL.READ)
  @ApiOperation({ summary: "Kanban panosu: stage + sıralı deal'ler" })
  board(@Query('pipelineId', ParseUUIDPipe) pipelineId: string) {
    return this.dealsService.findBoard(pipelineId);
  }

  @Get()
  @Permissions(PERMISSIONS.DEAL.READ)
  @ApiOperation({ summary: 'Deal listele (filtre/arama/sayfalama)' })
  findAll(@Query() q: QueryDealDto) {
    return this.dealsService.findAll(q);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.DEAL.READ)
  @ApiOperation({ summary: 'Tekil deal + aktiviteler' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dealsService.findOne(id);
  }

  @Post()
  @Permissions(PERMISSIONS.DEAL.CREATE)
  @ApiOperation({ summary: 'Yeni deal' })
  create(@Body() dto: CreateDealDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.dealsService.create(dto, actor);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.DEAL.UPDATE)
  @ApiOperation({ summary: 'Deal alan güncelle' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDealDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.dealsService.update(id, dto, actor);
  }

  @Patch(':id/move')
  @Permissions(PERMISSIONS.DEAL.MOVE)
  @ApiOperation({ summary: 'Aşama/sıra değiştir (Kanban move)' })
  move(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveDealDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.dealsService.move(id, dto, actor);
  }

  @Patch(':id/assign')
  @Permissions(PERMISSIONS.DEAL.UPDATE)
  @ApiOperation({ summary: 'Sahip ata/kaldır' })
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignDealDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.dealsService.assign(id, dto, actor);
  }

  @Post(':id/activities')
  @Permissions(PERMISSIONS.DEAL.UPDATE)
  @ApiOperation({ summary: 'Not/aktivite ekle' })
  addActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateActivityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.dealsService.addActivity(id, dto, actor);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.DEAL.DELETE)
  @ApiOperation({ summary: 'Deal soft delete' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.dealsService.remove(id, actor);
  }
}
