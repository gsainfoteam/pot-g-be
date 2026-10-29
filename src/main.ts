import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, Logger } from "@nestjs/common";
import { WsAdapter } from "@nestjs/platform-ws";
import { customMessageParser } from "@src/websocket/websocket.utils";
import { WsExceptionFilter } from "./global/filters/ws-exception.filter";
import { AllExceptionsFilter } from "./global/filters/all-exception.filter";
import { SlackService } from "nestjs-slack";
import { initializeMetrics, MetricsInterceptor } from "@gsainfoteam/nest-observability";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const slackService: SlackService = app.get(SlackService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: false, // 암시적 타입 변환 비활성화
      },
    }),
  );

  app.useGlobalInterceptors(new MetricsInterceptor());
  app.useGlobalFilters(
    new WsExceptionFilter(),
    new AllExceptionsFilter(slackService),
  );

  const wsAdapter = new WsAdapter(app);
  wsAdapter.setMessageParser(customMessageParser);
  app.useWebSocketAdapter(wsAdapter);


  await app.listen(3000);
}

const bootstrapWithOTEL = async () => {
  const logger = new Logger('Bootstrap');
  try {
    const serviceName = process.env.OTEL_SERVICE_NAME ?? 'potg-be';
    initializeMetrics(serviceName);
    await bootstrap();
  } catch (error) {
    logger.error('Failed to bootstrap application', error);
    process.exit(1);
  }
};

void bootstrapWithOTEL();
