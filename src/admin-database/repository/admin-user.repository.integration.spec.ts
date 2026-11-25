import "reflect-metadata";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users } from "../../../drizzle/schema/users";
import { DatabaseService } from "@src/database/database.service";
import { AdminUserListReqDto } from "@src/admin-user/dto/admin-user-list.dto";
import { AdminUserRepository } from "./admin-user.repository";

config({ quiet: true });
const localTests =
  process.env.RUN_LOCAL_DB_TESTS === "1" ? describe : describe.skip;

localTests("AdminUserRepository name search", () => {
  let client: Client;
  let repository: AdminUserRepository;

  beforeAll(async () => {
    const endpoint = new URL(process.env.DATABASE_URL);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname)) {
      throw new Error("Local database required");
    }
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 3000,
    });
    await client.connect();
    // A session-local table isolates fixtures from real users and disappears on disconnect.
    await client.query("CREATE TEMP TABLE users (LIKE public.users INCLUDING ALL)");
    const db = drizzle(client);
    repository = new AdminUserRepository({ db } as unknown as DatabaseService);
    await db.insert(users).values(
      [
        { name: "김민수", isDeleted: false },
        { name: "김민지", isDeleted: false },
        { name: "박민수", isDeleted: true },
        { name: "Alice Kim", isDeleted: false },
        { name: "이%_\\름", isDeleted: false },
      ].map((user) => ({
        ...user,
        pk: randomUUID(),
        idpSub: randomUUID(),
        email: "name-search@example.test",
      })),
    );
  });

  afterAll(async () => {
    await client?.end();
  });

  function request(values: Partial<AdminUserListReqDto>) {
    return Object.assign(new AdminUserListReqDto(), values);
  }

  it("matches a partial Korean name and uses the same filter for pagination totals", async () => {
    const req = request({ name: " 김민 ", size: 1 });
    const firstPage = await repository.findAll(req);
    const secondPage = await repository.findAll(request({ ...req, page: 1 }));
    expect(firstPage).toHaveLength(1);
    expect(secondPage).toHaveLength(1);
    expect(new Set([firstPage[0].name, secondPage[0].name])).toEqual(
      new Set(["김민수", "김민지"]),
    );
    expect(await repository.count(req)).toBe(2);
  });

  it("combines name search with the member status filter", async () => {
    expect(await repository.count(request({ name: "민수" }))).toBe(1);
    const withdrawn = await repository.findAll(
      request({ name: "민수", status: "withdrawn" }),
    );
    expect(withdrawn.map((user) => user.name)).toEqual(["박민수"]);
    expect(await repository.count(request({ name: "민수", status: "all" }))).toBe(2);
  });

  it("matches English names without case sensitivity", async () => {
    const result = await repository.findAll(request({ name: "alice" }));
    expect(result.map((user) => user.name)).toEqual(["Alice Kim"]);
  });

  it("treats SQL wildcard and escape characters as literal name text", async () => {
    const result = await repository.findAll(request({ name: "%_\\" }));
    expect(result.map((user) => user.name)).toEqual(["이%_\\름"]);
  });

  it("returns an empty result and zero total for an unmatched name", async () => {
    const req = request({ name: "없는사용자" });
    expect(await repository.findAll(req)).toEqual([]);
    expect(await repository.count(req)).toBe(0);
  });
});
