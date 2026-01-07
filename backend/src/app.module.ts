import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";

import ormconfig from "../ormconfig";
import { AllExceptionsFilter } from "./exceptions/all-exceptions.filter";
import { LlmModule } from "./llm/llm.module";
import { AnalysesModule } from "./analyses/analyses.module";
import { BatchUploadsModule } from "./batch-uploads/batch-uploads.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(ormconfig),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>("THROTTLE_TTL") || 900000, // 15 minutos
          limit: config.get<number>("THROTTLE_LIMIT") || 100,
        },
      ],
    }),
    LlmModule,
    AnalysesModule,
    BatchUploadsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
