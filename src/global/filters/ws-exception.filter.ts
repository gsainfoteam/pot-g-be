import { ArgumentsHost, Catch, Logger } from "@nestjs/common";
import { BaseWsExceptionFilter, WsException } from "@nestjs/websockets";

@Catch(WsException)
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: WsException, host: ArgumentsHost) {
    const data = host.switchToWs().getData();

    // Request 로깅
    this.logger.error(
      `[WS Request] Data: ${typeof data === "string" ? data : JSON.stringify(data)}`,
    );

    // Response & Stack trace 로깅
    if (exception.stack) {
      this.logger.error(
        `[WS Response] Message: ${exception.message} [Stack] ${exception.stack}`,
      );
    } else {
      this.logger.error(`[WS Response] Message: ${exception.message}`);
    }
  }
}
