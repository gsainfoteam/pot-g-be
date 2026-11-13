import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { OpenAPIObject } from "@nestjs/swagger";
import { createSwaggerDocument, setupSwagger } from "./swagger";
import * as request from "supertest";
// Terminus 11.1은 ESM이므로 CJS Jest에서는 서비스와 상태 검사 데코레이터만 대체합니다.
jest.mock("@nestjs/terminus", () => ({
  HealthCheck: () => () => undefined,
  HealthCheckService: class HealthCheckService {},
  MemoryHealthIndicator: class MemoryHealthIndicator {},
}));
import { AccountingController } from "@src/accounting/accounting.controller";
jest.mock("@src/accounting/accounting.service", () => ({
  AccountingService: class AccountingService {},
}));
import { AdminAccountController } from "@src/admin-account/admin-account.controller";
jest.mock("@src/admin-account/admin-account.service", () => ({
  AdminAccountService: class AdminAccountService {},
}));
import { AdminPotController } from "@src/admin-pot/admin-pot.controller";
jest.mock("@src/admin-pot/admin-pot.service", () => ({
  AdminPotService: class AdminPotService {},
}));
import { AdminRouteController } from "@src/admin-route/admin-route.controller";
jest.mock("@src/admin-route/admin-route.service", () => ({
  AdminRouteService: class AdminRouteService {},
}));
import { AppVersionController } from "@src/app-version/app-version.controller";
jest.mock("@src/app-version/app-version.service", () => ({
  AppVersionService: class AppVersionService {},
}));
import { AppVersionManagerController } from "@src/app-version/app-version.manager.controller";
jest.mock("@src/app-version/app-version.service", () => ({
  AppVersionService: class AppVersionService {},
}));
import { ManagerAuthController } from "@src/auth/manager-auth.controller";
jest.mock("@src/auth/manager-auth.service", () => ({
  ManagerAuthService: class ManagerAuthService {},
}));
import { DiscoveryController } from "@src/discovery/discovery.controller";
jest.mock("@src/discovery/discovery.service", () => ({
  PotGDiscoveryService: class PotGDiscoveryService {},
}));
import { HealthController } from "@src/health/health.controller";
jest.mock("@src/database/database.service", () => ({
  DatabaseService: class DatabaseService {},
}));
jest.mock("@src/health/drizzle.health", () => ({
  DrizzleHealthIndicator: class DrizzleHealthIndicator {},
}));
import { PotController } from "@src/pot/pot.controller";
jest.mock("@src/pot/pot.service", () => ({ PotService: class PotService {} }));
import { UserController } from "@src/user/user.controller";
jest.mock("@src/user/user.service", () => ({
  UserService: class UserService {},
}));

const controllers = [
  AccountingController,
  AdminAccountController,
  AdminPotController,
  AdminRouteController,
  AppVersionController,
  AppVersionManagerController,
  ManagerAuthController,
  DiscoveryController,
  HealthController,
  PotController,
  UserController,
];

describe("Swagger HTTP API contract", () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    // Controller metadata만 사용하여 DB, IDP, Firebase 연결 없이 명세를 생성합니다.
    const dependencies = [
      ...new Set(
        controllers.flatMap(
          (controller) =>
            Reflect.getMetadata("design:paramtypes", controller) || [],
        ),
      ),
    ];
    const module = await Test.createTestingModule({
      controllers,
      providers: dependencies.map((provide) => ({ provide, useValue: {} })),
    }).compile();
    app = module.createNestApplication();
    document = createSwaggerDocument(app);
    setupSwagger(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("documents every HTTP route with an operation summary and response schema", () => {
    const operations = Object.values(document.paths).flatMap((item) =>
      Object.entries(item).filter(([method]) =>
        ["get", "post", "patch", "delete"].includes(method),
      ),
    );
    expect(operations).toHaveLength(46);
    for (const [method, operation] of operations) {
      expect(operation.summary).toBeTruthy();
      const status = method === "post" ? "201" : "200";
      expect(
        operation.responses[status].content["application/json"].schema,
      ).toBeDefined();
    }
  });

  it("separates public, user, and manager authentication", () => {
    expect(document.paths["/api/v1/user/login"].post.security).toBeUndefined();
    expect(
      document.paths["/api/manager/v1/auth/login"].post.security,
    ).toBeUndefined();
    expect(
      document.paths["/api/v1/discovery/list"].get.security,
    ).toBeUndefined();
    expect(document.paths["/api/v1/user/info"].get.security).toEqual([
      { "user-access-token": [] },
    ]);
    expect(document.paths["/api/manager/v1/auth/me"].get.security).toEqual([
      { "manager-access-token": [] },
    ]);
    expect(
      document.paths["/api/manager/v1/admin-account"].post.responses["403"],
    ).toBeDefined();
  });

  it("preserves optional queries, nullable fields, enums, and typed pagination", () => {
    const query = document.paths["/api/v1/discovery/list"].get
      .parameters as any[];
    expect(query.find((p) => p.name === "limit")).toMatchObject({
      required: false,
      schema: { default: 20, maximum: 100 },
    });
    const schemas = document.components.schemas as Record<string, any>;
    expect(schemas.AdminPotDetailDto.properties.departure_time).toMatchObject({
      type: "string",
      format: "date-time",
      nullable: true,
    });
    expect(schemas.AdminPotDto.properties.status.enum).toContain(
      "WAIT_ACCOUNTING",
    );
    expect(schemas.CreatePotResDto.properties).toHaveProperty("result");
    expect(schemas.PotInfoDto.properties.route.$ref).toBe(
      "#/components/schemas/RouteDto",
    );
    const list = document.paths["/api/v1/discovery/list"].get.responses[
      "200"
    ] as any;
    expect(
      list.content["application/json"].schema.allOf[1].properties.list.items
        .$ref,
    ).toBe("#/components/schemas/PotDto");
    expect(schemas.PotEventDto.properties.data.anyOf).toHaveLength(10);
  });

  it("serves Swagger UI and machine readable documents under /api", async () => {
    await request(app.getHttpServer())
      .get("/api/docs/")
      .expect(200)
      .expect(/swagger-ui/);
    const response = await request(app.getHttpServer())
      .get("/api/docs-json")
      .expect(200);
    expect(response.body.paths).toHaveProperty("/health");
    await request(app.getHttpServer())
      .get("/api/docs-yaml")
      .expect(200)
      .expect(/openapi:/);
  });
});
