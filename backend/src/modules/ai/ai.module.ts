// src/modules/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { DealsModule } from '../deals/deals.module';
import { TasksModule } from '../tasks/tasks.module';
import { Customer360Module } from '../customer360/customer360.module';
import { SearchModule } from '../search/search.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiToolsService } from './ai-tools.service';
import { aiClientProvider } from './ai.client';

@Module({
  imports: [DealsModule, TasksModule, Customer360Module, SearchModule],
  controllers: [AiController],
  providers: [aiClientProvider, AiService, AiToolsService],
  exports: [AiService, AiToolsService],
})
export class AiModule {}
