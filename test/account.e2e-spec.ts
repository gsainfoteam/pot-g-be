import {
  createFakeIdp,
  fakeUser,
  type FakeIdp,
} from "@gsainfoteam/account-testing";
import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { WsAdapter } from "@nestjs/platform-ws";
import { eq } from "drizzle-orm";
import request = require("supertest");
import { randomUUID } from "node:crypto";
import { AppModule } from "@src/app.module";
import { DatabaseService } from "@src/database/database.service";
import { UserAuthService } from "@src/auth/user-auth.service";
import { FcmService } from "@src/fcm/fcm.service";
import { AdminAccountRole } from "@src/admin-database/entity/admin-account.entity";
import { users } from "../drizzle/schema/users";
import { device } from "../drizzle/schema/device";
import { adminAccount } from "../drizzle/schema/admin-account";
import { accountSession } from "../drizzle/schema/account-session";

// 실제 DB 가 필요합니다. DATABASE_URL 에 마이그레이션(npm run db:migrate)을 적용한 뒤 실행합니다.
const CLIENT_ID = "pot-g-test";

let idp: FakeIdp;
let app: INestApplication;
let db: DatabaseService["db"];

beforeAll(async () => {
  Object.assign(process.env, {
    ACCOUNT_ISSUER: "https://idp.test",
    ACCOUNT_CLIENT_ID: CLIENT_ID,
    ACCOUNT_CLIENT_SECRET: "test-secret",
    SESSION_SECRET: "test-session-secret-at-least-32-characters",
  });
  idp = await createFakeIdp();
  jest.spyOn(globalThis, "fetch").mockImplementation(idp.fetch);

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(FcmService)
    .useValue({
      sendPushNotification: jest.fn(),
      sendBulkPushNotification: jest.fn(),
      validateFcmToken: jest.fn(),
    })
    .compile();
  app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.init();
  db = app.get(DatabaseService).db;
});

afterAll(async () => {
  await app?.close();
});

const http = () => request(app.getHttpServer());

async function appLogin(user = fakeUser(), deviceId: string = randomUUID()) {
  const { body } = await idp.authorize({ clientId: CLIENT_ID, user });
  return http()
    .post("/api/v1/auth/login")
    .send({ ...body, transport: "body", device_id: deviceId })
    .expect(200);
}

async function managerLogin(user: ReturnType<typeof fakeUser>, status: number) {
  const { body } = await idp.authorize({ clientId: CLIENT_ID, user });
  return http()
    .post("/api/manager/v1/auth/login")
    .send({ ...body, transport: "body" })
    .expect(status);
}

describe("앱 로그인 (SDK 세션)", () => {
  it("처음 로그인하면 사용자와 기기를 만들고, 다시 로그인하면 같은 행에 연결한다", async () => {
    const user = fakeUser({ name: "홍길동" });
    const deviceId = randomUUID();

    const first = await appLogin(user, deviceId);
    const second = await appLogin(user, deviceId);

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.idpSub, user.sub));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "홍길동", email: user.email });
    const devices = await db
      .select()
      .from(device)
      .where(eq(device.userFk, rows[0].pk));
    expect(devices).toHaveLength(1);

    for (const res of [first, second]) {
      const info = await http()
        .get("/api/v1/user/info")
        .set("authorization", `Bearer ${res.body.access_token}`)
        .expect(200);
      expect(info.body).toMatchObject({ id: rows[0].pk, name: "홍길동" });
    }
  });

  it("device_id 가 없으면 로그인하지 못한다", async () => {
    const { body } = await idp.authorize({ clientId: CLIENT_ID });
    await http()
      .post("/api/v1/auth/login")
      .send({ ...body, transport: "body" })
      .expect(400);
  });

  it("토큰이 없으면 사용자 API 를 막는다", async () => {
    await http().get("/api/v1/user/info").expect(401);
  });

  it("SDK 이전에 발급한 토큰도 받는다", async () => {
    const login = await appLogin();
    const sub = login.body.access_token;
    const session = await app.get(UserAuthService).validateAccessToken(sub);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.pk, session.userId));

    const legacy = await db.transaction((tx) =>
      app
        .get(UserAuthService)
        .createNewJwtToken(user, { pk: session.devicePk } as never, tx),
    );
    await http()
      .get("/api/v1/user/info")
      .set("authorization", `Bearer ${legacy.accessToken}`)
      .expect(200);
  });

  it("탈퇴하면 SDK 세션을 지워서 refresh 하지 못한다", async () => {
    const user = fakeUser();
    const login = await appLogin(user);

    await http()
      .post("/api/v1/user/withdraw")
      .set("authorization", `Bearer ${login.body.access_token}`)
      .expect(201);

    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.idpSub, user.sub));
    expect(
      await db
        .select()
        .from(accountSession)
        .where(eq(accountSession.subject, row.pk)),
    ).toHaveLength(0);
    await http()
      .post("/api/v1/auth/refresh")
      .send({ refresh_token: login.body.refresh_token })
      .expect(401);
  });
});

describe("관리자 로그인", () => {
  it("관리자로 등록되지 않은 계정은 거절한다", async () => {
    await managerLogin(
      fakeUser({ email: `${randomUUID().slice(0, 8)}@gm.gist.ac.kr` }),
      403,
    );
  });

  it("등록된 관리자는 로그인하고 DB 의 현재 role 을 받는다", async () => {
    const email = `${randomUUID().slice(0, 8)}@gm.gist.ac.kr`;
    await db
      .insert(adminAccount)
      .values({ pk: randomUUID(), email, role: "superadmin" });

    const login = await managerLogin(
      fakeUser({ email: email.toUpperCase() }),
      200,
    );
    const me = await http()
      .get("/api/manager/v1/auth/me")
      .set("authorization", `Bearer ${login.body.access_token}`)
      .expect(200);
    expect(me.body).toEqual({ email, role: AdminAccountRole.superadmin });
  });

  it("사용자 access token 으로는 관리자 API 를 쓰지 못한다", async () => {
    const login = await appLogin();
    await http()
      .get("/api/manager/v1/auth/me")
      .set("authorization", `Bearer ${login.body.access_token}`)
      .expect(401);
  });
});
