import { Module } from "@nestjs/common";

import { LlmModule } from "src/llm/llm.module";
import { OutcomeDetectorService } from "./outcome-detector.service";

@Module({
  imports: [LlmModule],
  providers: [OutcomeDetectorService],
  exports: [OutcomeDetectorService],
})
export class OutcomeDetectorModule {}
