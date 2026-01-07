import { Module } from "@nestjs/common";

import { LlmModule } from "src/llm/llm.module";
import { OutcomeDetectorModule } from "src/outcome-detector/outcome-detector.module";
import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";

@Module({
  imports: [OutcomeDetectorModule, LlmModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
