import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LlmModule } from "src/llm/llm.module";
import { OutcomeDetectorModule } from "src/outcome-detector/outcome-detector.module";
import { AnalysesModule } from "src/analyses/analyses.module";
import { FilesModule } from "src/files/files.module";
import { BatchUploadsController } from "./batch-uploads.controller";
import { BatchUploadsService } from "./batch-uploads.service";
import { BatchJob } from "./entities/batch-job.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([BatchJob]),
    LlmModule,
    OutcomeDetectorModule,
    AnalysesModule,
    FilesModule,
  ],
  controllers: [BatchUploadsController],
  providers: [BatchUploadsService],
  exports: [BatchUploadsService],
})
export class BatchUploadsModule {}
