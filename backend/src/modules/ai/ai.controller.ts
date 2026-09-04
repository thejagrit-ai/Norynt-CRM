// src/modules/ai/ai.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import { Permissions } from '../../common/decorators/permissions.decorator';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { AiService } from './ai.service';
import { AiToolsService, ToolExecutionRequest } from './ai-tools.service';
import {
  DraftEmailDto,
  QueryAiDto,
  SummarizeDto,
  TestAiKeyDto,
  ChatAiDto,
  FetchModelsDto,
} from './dto/ai.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly aiTools: AiToolsService,
  ) {}

  @Post('models')
  @Permissions(PERMISSIONS.AI.USE)
  @ApiOperation({ summary: 'Sağlayıcı ve API anahtarına göre kullanılabilir modelleri tespit et' })
  fetchModels(@Body() dto: FetchModelsDto) {
    return this.ai.fetchAvailableModels(dto);
  }

  @Post('test-key')
  @Permissions(PERMISSIONS.AI.USE)
  @ApiOperation({ summary: 'AI API anahtarı doğrula (Groq, Gemini, OpenAI, Claude)' })
  testApiKey(@Body() dto: TestAiKeyDto) {
    return this.ai.testApiKey(dto);
  }

  @Post('chat')
  @Permissions(PERMISSIONS.AI.USE)
  @ApiOperation({ summary: 'Hesaba özel canlı CRM telemetrisi ile AI sohbet' })
  chat(
    @Body() dto: ChatAiDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.ai.chatWithAccountCrm(dto, actor);
  }

  @Get('status')
  @Permissions(PERMISSIONS.AI.USE)
  @ApiOperation({ summary: 'AI etkin mi + model bilgisi' })
  status() {
    return this.ai.status();
  }

  @Get('tools')
  @Permissions(PERMISSIONS.AI.USE)
  @ApiOperation({ summary: 'Kullanılabilir parametrik AI araçları kataloğu' })
  getTools() {
    return this.aiTools.getAvailableTools();
  }

  @Post('tools/execute')
  @Permissions(PERMISSIONS.AI.USE)
  @ApiOperation({ summary: 'Güvenli parametrik AI aracı çalıştır' })
  executeTool(
    @Body() req: ToolExecutionRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.aiTools.executeTool(req, actor);
  }

  @Get('priorities')
  @Permissions(PERMISSIONS.AI.USE)
  @ApiOperation({ summary: 'AI günlük öncelikler ve öneriler' })
  getDailyPriorities(@CurrentUser() actor: AuthenticatedUser) {
    return this.ai.getDailyPriorities(actor);
  }

  @Post('query')
  @Permissions(PERMISSIONS.AI.USE)
  @ApiOperation({ summary: 'Doğal dil CRM analitik sorgusu' })
  queryCrm(@Body() dto: QueryAiDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.ai.queryCrm(dto, actor);
  }

  @Post('deals/:id/score')
  @Permissions(PERMISSIONS.AI.USE)
  @ApiOperation({ summary: 'Fırsatı (deal) puanla ve sonraki adımları öner' })
  scoreDeal(@Param('id', ParseUUIDPipe) id: string) {
    return this.ai.scoreDeal(id);
  }

  @Post('draft-email')
  @Permissions(PERMISSIONS.AI.USE)
  @ApiOperation({ summary: 'Takip e-postası taslağı üret' })
  draftEmail(@Body() dto: DraftEmailDto) {
    return this.ai.draftEmail(dto);
  }

  @Post('summarize')
  @Permissions(PERMISSIONS.AI.USE)
  @ApiOperation({ summary: 'Serbest metni özetle' })
  summarize(@Body() dto: SummarizeDto) {
    return this.ai.summarize(dto);
  }
}
