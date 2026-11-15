import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { HttpErrorDto } from "@src/global/dto/http-error.dto";

export function createSwaggerDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("PotG API")
    .setDescription(
      "PotG 사용자 및 관리자 HTTP API. POST는 기본적으로 201을 반환합니다. " +
        "result 필드가 있는 응답은 HTTP 성공 상태에서도 업무상 실패를 나타낼 수 있습니다. " +
        "사용자 토큰은 사용자 로그인, 관리자 토큰은 관리자 OAuth 로그인으로 발급받습니다. " +
        "WebSocket 메시지는 이 HTTP 명세에 포함하지 않습니다.",
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "사용자 access_token",
      },
      "user-access-token",
    )
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "관리자 access_token",
      },
      "manager-access-token",
    )
    .build();

  return SwaggerModule.createDocument(app, config, {
    extraModels: [HttpErrorDto],
  });
}

export function setupSwagger(app: INestApplication) {
  SwaggerModule.setup("api/docs", app, createSwaggerDocument(app), {
    jsonDocumentUrl: "api/docs-json",
    yamlDocumentUrl: "api/docs-yaml",
    swaggerOptions: { tagsSorter: "alpha", operationsSorter: "alpha" },
  });
}
