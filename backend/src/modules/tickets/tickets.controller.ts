// src/modules/tickets/tickets.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { TicketsService } from './tickets.service';
import {
  CreateTicketDto,
  CreateTicketMessageDto,
  QueryTicketDto,
  UpdateTicketDto,
} from './dto/ticket.dto';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @Permissions(PERMISSIONS.TICKET.CREATE)
  create(
    @Body() dto: CreateTicketDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.ticketsService.create(dto, actor);
  }

  @Get()
  @Permissions(PERMISSIONS.TICKET.READ)
  findAll(@Query() q: QueryTicketDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.ticketsService.findAll(q, actor);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.TICKET.READ)
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.TICKET.UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(id, dto);
  }

  @Post(':id/messages')
  @Permissions(PERMISSIONS.TICKET.UPDATE)
  addMessage(
    @Param('id') id: string,
    @Body() dto: CreateTicketMessageDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.ticketsService.addMessage(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.TICKET.DELETE)
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}
