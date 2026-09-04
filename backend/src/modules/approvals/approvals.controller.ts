// src/modules/approvals/approvals.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApprovalStatus } from '@prisma/client';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import { Permissions } from '../../common/decorators/permissions.decorator';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { ApprovalsService } from './approvals.service';
import { CreateApprovalDto, DecideApprovalDto } from './dto/approval.dto';

@ApiTags('approvals')
@ApiBearerAuth()
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Get()
  @Permissions(PERMISSIONS.APPROVAL.READ)
  @ApiOperation({
    summary: 'Onay bekleyen veya geçmiş onay taleplerini listele',
  })
  list(
    @CurrentUser() actor: AuthenticatedUser,
    @Query('status') status?: ApprovalStatus,
  ) {
    return this.approvals.list(actor, status);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.APPROVAL.READ)
  @ApiOperation({ summary: 'Onay talebi detayını görüntüle' })
  getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.approvals.getById(id, actor);
  }

  @Post()
  @Permissions(PERMISSIONS.APPROVAL.MANAGE)
  @ApiOperation({ summary: 'Yeni bir onay talebi oluştur' })
  create(
    @Body() dto: CreateApprovalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.approvals.create(dto, actor);
  }

  @Post(':id/decide')
  @Permissions(PERMISSIONS.APPROVAL.MANAGE)
  @ApiOperation({
    summary: 'Onay talebini onayla veya reddet (HITL Execution)',
  })
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideApprovalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.approvals.decide(id, dto, actor);
  }
}
