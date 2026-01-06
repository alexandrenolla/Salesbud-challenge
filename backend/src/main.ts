import { Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import * as bodyParser from "body-parser";

import { AppModule } from "./app.module";
import { DEFAULT_VERSION } from "./utils/constants";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    logger:
      process.env.NODE_ENV === "production"
        ? ["error", "warn"]
        : process.env.NODE_ENV === "debug"
          ? ["log", "error", "warn", "debug", "verbose"]
          : ["log", "error", "warn", "debug"],
  });

  // Body parser with larger limit for long transcripts
  app.use(bodyParser.json({ limit: "50mb" }));

  // Security headers
  app.use(helmet());

  // CORS configuration
  const allowedOrigins =
    process.env.NODE_ENV === "production"
      ? [process.env.FRONTEND_URL]
      : [
          "http://localhost:5173",
          "http://localhost:3000",
          "http://127.0.0.1:5173",
        ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  });

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: DEFAULT_VERSION,
  });

  // Global prefix
  app.setGlobalPrefix("api");

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle("Playbook Insights API")
    .setDescription("API for sales transcript analysis and playbook generation")
    .setVersion("1.0")
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT || 3001;
  await app.listen(port);

  Logger.log(`Application is running on port ${port}`);
}

bootstrap();
