import { AdminPopoMessageStatusService } from "./admin-popo-message-status.service";

describe("AdminPopoMessageStatusService", () => {
  const findReservations = jest.fn();
  const countReservations = jest.fn();
  const findSent = jest.fn();
  const countSent = jest.fn();
  const service = new AdminPopoMessageStatusService({
    findReservations,
    countReservations,
    findSent,
    countSent,
  } as any);

  beforeEach(() => jest.clearAllMocks());

  it("marks a reservation overdue once its send time has passed", async () => {
    const row = {
      potPk: "p",
      potName: "pot",
      type: "popo-auto-archive-v1",
      createdAt: new Date(),
    };
    findReservations.mockResolvedValue([
      { ...row, pk: "r1", sendAfter: new Date(Date.now() - 60_000) },
      { ...row, pk: "r2", sendAfter: new Date(Date.now() + 60_000) },
    ]);
    countReservations.mockResolvedValue(2);

    const res = await service.listReservations({ page: 0, size: 10 });

    expect(res.total).toBe(2);
    expect(res.items.map((i) => i.status)).toEqual(["overdue", "scheduled"]);
  });

  it("fills message variables of sent messages and falls back to the raw template", async () => {
    const sentAt = new Date();
    findSent.mockResolvedValue([
      {
        potPk: "p1",
        eventId: 1,
        potName: "pot",
        sentAt,
        data: {
          popoChatType: "popo-departure-confirmed-v1",
          message: "출발 {departureTimeEndsAt}",
          actionBtns: [],
          formatArguments: { departureTimeEndsAt: "3시" },
        },
      },
      {
        potPk: "p2",
        eventId: 2,
        potName: "pot2",
        sentAt,
        data: {
          popoChatType: "popo-departure-confirmed-v1",
          message: "{} and {name}",
          actionBtns: [],
        },
      },
    ]);
    countSent.mockResolvedValue(2);

    const res = await service.listSent({ page: 0, size: 10 });

    expect(res.total).toBe(2);
    expect(res.items[0].content).toBe("출발 3시");
    expect(res.items[1].content).toBe("{} and {name}");
    expect(res.items.map((i) => i.event_id)).toEqual([1, 2]);
    expect(res.items[0].sent_at).toBe(sentAt.toISOString());
  });
});
