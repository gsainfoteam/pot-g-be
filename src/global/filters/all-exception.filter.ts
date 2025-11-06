import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { SlackService } from "nestjs-slack";
import { WsException } from "@nestjs/websockets";

@Catch() // 모든 예외를 캐치
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly slackService: SlackService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // 이미 HttpExceptionFilter 및 WsExceptionFilter에서 처리된 예외는 무시
    if (
      exception instanceof HttpException ||
      exception instanceof WsException
    ) {
      // 다만 UnauthorizedException 은 HttpExceptionFilter에서 처리되지 않으므로 여기서 로깅 없이 처리
      if (exception instanceof UnauthorizedException) {
        const status = exception.getStatus();
        response.status(status).json({
          statusCode: status,
          message: exception.message,
        });
      }

      return;
    }

    const request = ctx.getRequest<Request>();

    // Critical 에러 로깅 (스택 트레이스 및 상세 정보 포함)
    let errorMessage: string;
    let stackTrace: string | undefined;

    if (exception instanceof Error) {
      errorMessage = `[CRITICAL][${request.method}][${request.url}] Unexpected Error\nError Name: ${exception.name}\nMessage: ${exception.message}`;
      stackTrace = exception.stack;
    } else {
      errorMessage = `[CRITICAL][${request.method}][${request.url}] Unexpected Error: ${String(exception)}`;
      stackTrace = "";
    }

    this.logger.error(errorMessage, stackTrace);

    // Slack으로 에러 알림 전송
    this.slackService
      .sendText(
        `*[CRITICAL ERROR]*\n${errorMessage}${stackTrace ? `\n\`\`\`${stackTrace}\`\`\`` : ""}`,
      )
      .catch((err) => {
        this.logger.error("Failed to send Slack notification", err);
      });

    // 클라이언트에게는 안전한 메시지만 전달
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "An unexpected error occurred.",
    });
  }
}
