import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LlmModule } from "src/llm/llm.module";
import { OutcomeDetectorModule } from "src/outcome-detector/outcome-detector.module";
import { Analysis } from "./entities/analysis.entity";
import { AnalysesService } from "./analyses.service";
import { AnalysesController } from "./analyses.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Analysis]), LlmModule, OutcomeDetectorModule],
  controllers: [AnalysesController],
  providers: [AnalysesService],
  exports: [AnalysesService],
})
export class AnalysesModule {}
