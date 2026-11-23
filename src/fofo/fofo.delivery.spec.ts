import { Logger } from "@nestjs/common";
import { FofoService } from "./fofo.service";

describe("reserved delivery eligibility", () => {
  const event = {
    pot_pk: "pot",
    timestamp: 1,
    id: 42,
    event_type: "popo_chat_v1",
    data: { popo_chat_type: "fofo-delay-check-request-v1" },
  };
  function setup() {
    const delivery = {
      pk: "delivery",
      potFk: "pot",
      potName: "Pot",
      userPks: ["joined", "left"],
      events: [event],
      progress: {},
      leaseToken: "lease",
      expiresAt: new Date(Date.now() + 30_000),
    };
    const pot = {
      pk: "pot",
      isDeleted: false,
      isArchived: false,
      joinedUserPks: ["joined"],
      departureTime: delivery.expiresAt,
    };
    const repository = {
      findReady: jest.fn().mockResolvedValue([delivery]),
      claim: jest.fn().mockResolvedValue(delivery),
      saveProgress: jest.fn(),
      finishAttempt: jest.fn(),
    };
    const broadcast = { broadcastReservedPotEvent: jest.fn() };
    const database = { db: { transaction: jest.fn() } };
    const service = new FofoService(
      database as any,
      {} as any,
      {} as any,
      { findByIdWithoutChat: jest.fn().mockResolvedValue(pot) } as any,
      broadcast as any,
      {} as any,
      repository as any,
      {} as any,
    );
    return { service, repository, broadcast, pot, delivery, database };
  }
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-11-21T00:00:00Z"));
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("filters departed recipients for every retry and sends outside a transaction", async () => {
    const { service, broadcast, repository, pot, database } = setup();
    broadcast.broadcastReservedPotEvent.mockRejectedValueOnce(
      new Error("FCM down"),
    );
    await service.processPendingDeliveries();
    expect(broadcast.broadcastReservedPotEvent.mock.calls[0][1]).toEqual([
      "joined",
    ]);
    expect(repository.finishAttempt).toHaveBeenCalledWith(
      "delivery",
      "lease",
      new Date(Date.now() + 60_000),
    );
    pot.joinedUserPks = [];
    await service.processPendingDeliveries();
    expect(broadcast.broadcastReservedPotEvent.mock.calls[1][1]).toEqual([]);
    expect(database.db.transaction).not.toHaveBeenCalled();
  });

  it.each(["fofo-delay-check-request-v1", "popo-delay-check-request-v1"])(
    "expires %s at departure even for old rows lacking expiresAt",
    async (type) => {
      for (const legacy of [false, true]) {
        const { service, delivery, broadcast } = setup();
        delivery.events = [{ ...event, data: { popo_chat_type: type } }];
        if (legacy) delivery.expiresAt = null;
        jest.advanceTimersByTime(30_000);
        await service.processPendingDeliveries();
        expect(broadcast.broadcastReservedPotEvent.mock.calls[0][1]).toEqual([]);
      }
    },
  );

  it("retains archive recipients after membership has ended", async () => {
    const { service, pot, delivery, broadcast } = setup();
    pot.isArchived = true;
    pot.joinedUserPks = [];
    delivery.events = [
      {
        ...event,
        event_type: "archive_v1",
        data: { popo_chat_type: undefined },
      },
    ];
    delivery.expiresAt = null;
    await service.processPendingDeliveries();
    expect(broadcast.broadcastReservedPotEvent.mock.calls[0][1]).toEqual([
      "joined",
      "left",
    ]);
  });

  it("does not send deleted pots or work claimed by another worker", async () => {
    const { service, pot, repository, broadcast } = setup();
    pot.isDeleted = true;
    await service.processPendingDeliveries();
    expect(broadcast.broadcastReservedPotEvent.mock.calls[0][1]).toEqual([]);
    broadcast.broadcastReservedPotEvent.mockClear();
    repository.claim.mockResolvedValueOnce(undefined);
    await service.processPendingDeliveries();
    expect(broadcast.broadcastReservedPotEvent).not.toHaveBeenCalled();
  });
});
