import { Module } from "@nestjs/common";

import { OutcomeDetectorModule } from "src/outcome-detector/outcome-detector.module";
import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";

@Module({
  imports: [OutcomeDetectorModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
