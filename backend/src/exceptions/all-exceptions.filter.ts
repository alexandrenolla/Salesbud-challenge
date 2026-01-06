import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? this.extractMessage(exception)
        : "Internal server error";

    const responseBody = {
      statusCode: httpStatus,
      message,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    if (httpStatus === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unexpected error: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }

  private extractMessage(exception: HttpException): string | string[] {
    const response = exception.getResponse();
    if (typeof response === "string") {
      return response;
    }
    if (typeof response === "object" && "message" in response) {
      return (response as { message: string | string[] }).message;
    }
    return exception.message;
  }
}
