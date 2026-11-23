import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq } from "drizzle-orm";
import { Logger } from "@nestjs/common";
import { FofoService } from "./fofo.service";
import { PotService } from "@src/pot/pot.service";
import { DatabaseService } from "@src/database/database.service";
import { TxType } from "@src/global/types/tx.types";
import { FofoChatMsgRepository } from "@src/database/repository/fofo-chat-msg.repository";
import { FofoChatReservationRepository } from "@src/database/repository/fofo-chat-reservation.repository";
import { FofoChatDeliveryRepository } from "@src/database/repository/fofo-chat-delivery.repository";
import { PotRoomRepository } from "@src/database/repository/pot-room.repository";
import { PotEventRepository } from "@src/database/repository/pot-event.repository";
import { UserPotRoomRepository } from "@src/database/repository/user-pot-room.repository";
import { PotCreateEventV1 } from "@src/pot/event/v1/pot-create-event";
import { PotDepartureConfirmEventV1 } from "@src/pot/event/v1/pot-departure-confirm-event";
import { PotEventReducer } from "@src/pot/event/pot-event-reducer";
import { users } from "../../drizzle/schema/users";
import { route } from "../../drizzle/schema/route";
import { potRoom } from "../../drizzle/schema/pot-room";
import { potEvent } from "../../drizzle/schema/pot-event";
import { fofoChatReservation } from "../../drizzle/schema/fofo-chat-reservation";
import { fofoChatDelivery } from "../../drizzle/schema/fofo-chat-delivery";

config({ quiet: true });
// Opt in explicitly. These tests use only dedicated fixtures in a local DB.
const localTests =
  process.env.RUN_LOCAL_DB_TESTS === "1" ? describe : describe.skip;

localTests("Fofo durable reservation processing", () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;
  let database: DatabaseService;
  let userPk: string;
  let potPk: string;
  let routePk: string;
  let reservationPk: string;
  let service: FofoService;
  const broadcaster = {
    broadcastReservedPotEvent: jest.fn(),
    asyncBroadcastPotEvent: jest.fn(),
  };

  async function makeService(dbService = database, initialize = true) {
    const reservations = new FofoChatReservationRepository(dbService);
    const archiveService = new PotService(
      dbService,
      {} as any,
      broadcaster as any,
      {
        deleteAllFofoChatReservationInTransaction: (pk: string, tx: TxType) =>
          reservations.deleteByPotFk(pk, tx),
      } as any,
      new PotRoomRepository(dbService),
      new PotEventRepository(dbService),
      new UserPotRoomRepository(dbService),
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    const fofo = new FofoService(
      dbService,
      new FofoChatMsgRepository(dbService),
      reservations,
      new PotEventRepository(dbService),
      broadcaster as any,
      archiveService,
      new FofoChatDeliveryRepository(dbService),
      new PotRoomRepository(dbService),
    );
    if (initialize) await fofo.onModuleInit();
    return fofo;
  }

  async function seed(
    type:
      | "popo-reminder-taxi-call-v1"
      | "fofo-delay-check-request-v1"
      | "popo-auto-archive-no-departure-confirm-v1" = "popo-reminder-taxi-call-v1",
  ) {
    userPk = randomUUID();
    potPk = randomUUID();
    reservationPk = randomUUID();
    const now = Date.now();
    const created = PotCreateEventV1.generatePotCreateEvent(
      potPk,
      new Date(now - 60_000),
      {
        potRoomPk: potPk,
        name: "Local timer verification",
        createUserId: userPk,
        routePk,
        maxCapacity: 4,
        departureAvailableStartTime: new Date(now - 120_000),
        departureAvailableEndTime: new Date(now + 60 * 60_000),
        createAt: new Date(now - 60_000),
        updateAt: new Date(now - 60_000),
      },
    );
    const pot = PotEventReducer.reduceFromInitial([created]);
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        pk: userPk,
        isDeleted: false,
        idpSub: userPk,
        name: "Timer verification",
        email: "timer-verification@example.invalid",
      });
      await new PotRoomRepository(database).insert(pot.toPotRoomEntity(), tx);
      await new PotEventRepository(database).saveEvent(created, tx);
      if (type !== "popo-auto-archive-no-departure-confirm-v1") {
        const confirmed =
          PotDepartureConfirmEventV1.generatePotDepartureConfirmEvent(
            potPk,
            new Date(now - 30_000),
            {
              potRoomPk: potPk,
              userPk,
              departureTime: new Date(now + 20 * 60_000),
            },
          );
        await new PotEventRepository(database).saveEvent(confirmed, tx);
        await new PotRoomRepository(database).setDepartureTime(potPk, tx);
      }
      await new FofoChatReservationRepository(database).insert(
        {
          pk: reservationPk,
          potFk: potPk,
          fofoChatMsgType: type,
          sendAfter: new Date(now - 1000),
          createdAt: new Date(now),
          updatedAt: new Date(now),
          formatArguments: {
            remainDepartureTime: 20,
            stationName: "광주송정역",
          },
        },
        tx,
      );
    });
  }

  async function messageRows() {
    return db
      .select()
      .from(potEvent)
      .where(and(eq(potEvent.potFk, potPk), eq(potEvent.type, "popo_chat_v1")));
  }

  it("sends a delay check through the shared durable reservation path", async () => {
    // The seeded policy is disabled by default; enable only this worker's template.
    const template = service.getFofoChatMsgByType("fofo-delay-check-request-v1");
    jest
      .spyOn(service, "getFofoChatMsgByType")
      .mockReturnValue({ ...template, enabled: true });
    await seed("fofo-delay-check-request-v1");
    await service.processReservedFofoChatReservation(reservationPk);
    await service.processReservedFofoChatReservation(reservationPk);

    expect(await messageRows()).toHaveLength(1);
    expect(
      await db
        .select()
        .from(fofoChatReservation)
        .where(eq(fofoChatReservation.pk, reservationPk)),
    ).toHaveLength(0);
    expect(broadcaster.broadcastReservedPotEvent).toHaveBeenCalledTimes(1);
    expect(broadcaster.broadcastReservedPotEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          popo_chat_type: "fofo-delay-check-request-v1",
          action_btns: ["delay-check-btn"],
        }),
      }),
      expect.anything(),
      expect.anything(),
      expect.any(Object),
      expect.any(Function),
      expect.any(Date),
    );
  });

  it("removes a disabled delay-check reservation without sending an event", async () => {
    const template = service.getFofoChatMsgByType("fofo-delay-check-request-v1");
    jest
      .spyOn(service, "getFofoChatMsgByType")
      .mockReturnValue({ ...template, enabled: false });
    await seed("fofo-delay-check-request-v1");

    await service.processReservedFofoChatReservation(reservationPk);

    expect(await messageRows()).toHaveLength(0);
    expect(
      await db
        .select()
        .from(fofoChatReservation)
        .where(eq(fofoChatReservation.pk, reservationPk)),
    ).toHaveLength(0);
    expect(broadcaster.broadcastReservedPotEvent).not.toHaveBeenCalled();
  });

  beforeAll(async () => {
    const endpoint = new URL(process.env.DATABASE_URL);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname))
      throw Error("Local database required");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 3000,
    });
    db = drizzle(pool);
    database = { db } as DatabaseService;
    [{ pk: routePk }] = await db.select({ pk: route.pk }).from(route).limit(1);
  });
  beforeEach(async () => {
    broadcaster.broadcastReservedPotEvent
      .mockReset()
      .mockResolvedValue(undefined);
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    service = await makeService();
  });
  afterEach(async () => {
    if (potPk) {
      await db.transaction(async (tx) => {
        await tx
          .delete(fofoChatDelivery)
          .where(eq(fofoChatDelivery.potFk, potPk));
        await tx
          .delete(fofoChatReservation)
          .where(eq(fofoChatReservation.potFk, potPk));
        await tx.delete(potEvent).where(eq(potEvent.potFk, potPk));
        await tx.delete(potRoom).where(eq(potRoom.pk, potPk));
        await tx.delete(users).where(eq(users.pk, userPk));
      });
    }
    potPk = undefined;
    jest.restoreAllMocks();
  });
  afterAll(async () => {
    await pool?.end();
  });

  it("commits one event and removes its reservation before broadcasting", async () => {
    await seed();
    broadcaster.broadcastReservedPotEvent.mockImplementationOnce(async () => {
      expect(await messageRows()).toHaveLength(1);
      expect(
        await db
          .select()
          .from(fofoChatReservation)
          .where(eq(fofoChatReservation.pk, reservationPk)),
      ).toHaveLength(0);
      expect(
        await db
          .select()
          .from(fofoChatDelivery)
          .where(eq(fofoChatDelivery.pk, reservationPk)),
      ).toHaveLength(1);
    });
    await service.processReservedFofoChatReservation(reservationPk);
    expect(broadcaster.broadcastReservedPotEvent).toHaveBeenCalledTimes(1);
    expect(
      await db
        .select()
        .from(fofoChatDelivery)
        .where(eq(fofoChatDelivery.pk, reservationPk)),
    ).toHaveLength(0);
  });

  it("serializes concurrent workers without duplicating the saved message", async () => {
    await seed();
    const otherWorker = await makeService();
    await Promise.all([
      service.processReservedFofoChatReservation(reservationPk),
      otherWorker.processReservedFofoChatReservation(reservationPk),
    ]);
    expect(await messageRows()).toHaveLength(1);
    expect(broadcaster.broadcastReservedPotEvent).toHaveBeenCalledTimes(1);
  });

  it("releases the sole pool connection before network delivery needs another query", async () => {
    await seed();
    const singlePool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      connectionTimeoutMillis: 1000,
    });
    try {
      const singleDatabase = { db: drizzle(singlePool) } as DatabaseService;
      const worker = await makeService(singleDatabase);
      broadcaster.broadcastReservedPotEvent.mockImplementationOnce(async () => {
        await singlePool.query("SELECT 1");
      });
      await worker.processReservedFofoChatReservation(reservationPk);
      expect(
        await db
          .select()
          .from(fofoChatDelivery)
          .where(eq(fofoChatDelivery.pk, reservationPk)),
      ).toHaveLength(0);
      expect(broadcaster.broadcastReservedPotEvent).toHaveBeenCalledTimes(1);
    } finally {
      await singlePool.end();
    }
  });

  it("recovers a committed delivery after simulated shutdown before network sending", async () => {
    await seed();
    const transaction = jest
      .fn()
      .mockImplementationOnce((work) => db.transaction(work))
      .mockRejectedValueOnce(
        new Error("Simulated shutdown after event commit"),
      );
    const crashingService = await makeService(
      { db: { transaction } } as unknown as DatabaseService,
      false,
    );
    // Template loading needs normal reads, so use the already initialized cache.
    (crashingService as any).cachedFofoChatMsgs = (
      service as any
    ).cachedFofoChatMsgs;
    await expect(
      crashingService.processReservedFofoChatReservation(reservationPk),
    ).rejects.toThrow("Simulated shutdown");
    expect(await messageRows()).toHaveLength(1);
    const restartedService = await makeService();
    await restartedService.processPendingDeliveries();
    expect(await messageRows()).toHaveLength(1);
    expect(broadcaster.broadcastReservedPotEvent).toHaveBeenCalledTimes(1);
  });

  it("keeps failed deliveries for retry and reuses the original event", async () => {
    await seed();
    broadcaster.broadcastReservedPotEvent.mockRejectedValueOnce(
      new Error("Network unavailable"),
    );
    await service.processReservedFofoChatReservation(reservationPk);
    const [pending] = await db
      .select()
      .from(fofoChatDelivery)
      .where(eq(fofoChatDelivery.pk, reservationPk));
    expect(pending).toBeDefined();
    const originalEventId =
      broadcaster.broadcastReservedPotEvent.mock.calls[0][0].id;
    expect(await messageRows()).toHaveLength(1);
    await db
      .update(fofoChatDelivery)
      .set({ nextAttemptAt: new Date(Date.now() - 1000) })
      .where(eq(fofoChatDelivery.pk, reservationPk));
    const restartedService = await makeService();
    await restartedService.processPendingDeliveries();
    expect(broadcaster.broadcastReservedPotEvent).toHaveBeenCalledTimes(2);
    expect(broadcaster.broadcastReservedPotEvent.mock.calls[1][0].id).toBe(
      originalEventId,
    );
    expect(await messageRows()).toHaveLength(1);
    expect(
      await db
        .select()
        .from(fofoChatDelivery)
        .where(eq(fofoChatDelivery.pk, reservationPk)),
    ).toHaveLength(0);
  });

  it("leaves a reservation pending if saving its delivery intent fails", async () => {
    await seed();
    jest
      .spyOn(FofoChatDeliveryRepository.prototype, "insert")
      .mockRejectedValueOnce(new Error("Write failure"));
    await expect(
      service.processReservedFofoChatReservation(reservationPk),
    ).rejects.toThrow("Write failure");
    expect(await messageRows()).toHaveLength(0);
    expect(
      await db
        .select()
        .from(fofoChatReservation)
        .where(eq(fofoChatReservation.pk, reservationPk)),
    ).toHaveLength(1);
    expect(broadcaster.broadcastReservedPotEvent).not.toHaveBeenCalled();
  });

  it("recovers an expired lease and rejects writes from the previous worker", async () => {
    await seed();
    broadcaster.broadcastReservedPotEvent.mockRejectedValueOnce(
      new Error("Network unavailable"),
    );
    await service.processReservedFofoChatReservation(reservationPk);
    await db
      .update(fofoChatDelivery)
      .set({ nextAttemptAt: new Date(Date.now() - 1000) })
      .where(eq(fofoChatDelivery.pk, reservationPk));
    const repository = new FofoChatDeliveryRepository(database);
    const claims = await Promise.all([
      repository.claim(reservationPk),
      repository.claim(reservationPk),
    ]);
    const claimed = claims.filter(Boolean);
    expect(claimed).toHaveLength(1);
    const first = claimed[0];
    await db
      .update(fofoChatDelivery)
      .set({ leaseUntil: new Date(Date.now() - 1000) })
      .where(eq(fofoChatDelivery.pk, reservationPk));
    const recovered = await repository.claim(reservationPk);
    expect(recovered.leaseToken).not.toBe(first.leaseToken);
    await expect(
      repository.saveProgress(reservationPk, first.leaseToken, {}),
    ).rejects.toThrow("lease lost");
    await repository.finishAttempt(reservationPk, first.leaseToken);
    expect(
      await db
        .select()
        .from(fofoChatDelivery)
        .where(eq(fofoChatDelivery.pk, reservationPk)),
    ).toHaveLength(1);
    await repository.finishAttempt(reservationPk, recovered.leaseToken);
    expect(
      await db
        .select()
        .from(fofoChatDelivery)
        .where(eq(fofoChatDelivery.pk, reservationPk)),
    ).toHaveLength(0);
  });

  it("rechecks cancelled and rescheduled reservations before sending", async () => {
    await seed();
    await db
      .update(fofoChatReservation)
      .set({ sendAfter: new Date(Date.now() + 60_000) })
      .where(eq(fofoChatReservation.pk, reservationPk));
    await service.processReservedFofoChatReservation(reservationPk);
    expect(await messageRows()).toHaveLength(0);
    await db
      .delete(fofoChatReservation)
      .where(eq(fofoChatReservation.pk, reservationPk));
    await service.processReservedFofoChatReservation(reservationPk);
    expect(broadcaster.broadcastReservedPotEvent).not.toHaveBeenCalled();
  });

  it("archives a pot and saves both notifications atomically", async () => {
    await seed("popo-auto-archive-no-departure-confirm-v1");
    await service.processReservedFofoChatReservation(reservationPk);
    const [room] = await db.select().from(potRoom).where(eq(potRoom.pk, potPk));
    expect(room.isArchived).toBe(true);
    expect(await messageRows()).toHaveLength(1);
    expect(
      broadcaster.broadcastReservedPotEvent.mock.calls.map(
        ([event]) => event.event_type,
      ),
    ).toEqual(["popo_chat_v1", "archive_v1"]);
  });
});
