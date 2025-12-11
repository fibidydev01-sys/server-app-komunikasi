// ================================================
// FILE 1: src/modules/turn/turn.module.ts
// ================================================

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TurnController } from './turn.controller';
import { TurnService } from './turn.service';

@Module({
  imports: [HttpModule],
  controllers: [TurnController],
  providers: [TurnService],
  exports: [TurnService],
})
export class TurnModule {}
