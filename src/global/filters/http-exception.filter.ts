import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Request 로깅
    this.logger.error(`[Request] ${request.method} ${request.url}`);

    // Response & Stack trace 로깅
    if (exception.stack) {
      this.logger.error(
        `[Response] Status: ${status}, Message: ${exception.message} [Stack] ${exception.stack}`,
      );
    } else {
      this.logger.error(
        `[Response] Status: ${status}, Message: ${exception.message}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }
}
