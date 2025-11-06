import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { WsAdapter } from "@nestjs/platform-ws";
import { customMessageParser } from "@src/websocket/websocket.utils";
import { HttpExceptionFilter } from "./global/filters/http-exception.filter";
import { WsExceptionFilter } from "./global/filters/ws-exception.filter";
import { AllExceptionsFilter } from "./global/filters/all-exception.filter";
import { LoggerService } from "@src/global/logger/logger.service";
import { HttpLoggingInterceptor } from "@src/global/interceptors/http-logging.interceptor";
import { SlackService } from "nestjs-slack";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const loggerService: LoggerService = app.get(LoggerService);
  app.useLogger(loggerService);

  const slackService: SlackService = app.get(SlackService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: false, // 암시적 타입 변환 비활성화
      },
    }),
  );

  app.useGlobalInterceptors(new HttpLoggingInterceptor());
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new WsExceptionFilter(),
    new AllExceptionsFilter(slackService),
  );

  const wsAdapter = new WsAdapter(app);
  wsAdapter.setMessageParser(customMessageParser);
  app.useWebSocketAdapter(wsAdapter);

  await app.listen(3000);
}
bootstrap();
