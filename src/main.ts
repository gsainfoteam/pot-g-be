import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { WsAdapter } from "@nestjs/platform-ws";
import { customMessageParser } from "@src/websocket/websocket.utils";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: false, // 암시적 타입 변환 비활성화
      },
    }),
  );

  const wsAdapter = new WsAdapter(app);
  wsAdapter.setMessageParser(customMessageParser);
  app.useWebSocketAdapter(wsAdapter);

  await app.listen(3000);
}
bootstrap();
