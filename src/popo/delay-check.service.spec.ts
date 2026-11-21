import { ConfigService } from "@nestjs/config";
import { PopoChatMsgRepository } from "@src/database/repository/popo-chat-msg.repository";
import { PopoChatReservationRepository } from "@src/database/repository/popo-chat-reservation.repository";
import { RouteService } from "@src/discovery/route.service";
import { TxType } from "@src/global/types/tx.types";
import { Pot } from "@src/pot/model/pot";
import { DelayCheckService } from "./delay-check.service";

describe("DelayCheckService reservation", () => {
  const now = new Date("2026-11-20T15:00:00+09:00");
  const tx = {} as TxType;
  const find = jest.fn();
  const insert = jest.fn();
  const deleteByPotFkAndType = jest.fn();
  const getRouteById = jest.fn();
  const service = new DelayCheckService(
    new ConfigService({ DELAY_CHECK_ROUTE_IDS: "songjeong, usquare" }),
    { findByType: find } as unknown as PopoChatMsgRepository,
    {
      insert,
      deleteByPotFkAndType,
    } as unknown as PopoChatReservationRepository,
    { getRouteById } as unknown as RouteService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now });
    find.mockResolvedValue({ enabled: true, offsetMinutes: -10 });
  });

  afterEach(() => jest.useRealTimers());

  it.each([
    ["songjeong", "광주송정역", 10, "15:20"],
    ["usquare", "광주(유•스퀘어)", 15, "15:15"],
  ])(
    "reserves the %s notice at the configured offset",
    async (routePk, stationName, minutesBeforeDeparture, sendTime) => {
      getRouteById.mockReturnValue({ fromStop: { nameKor: stationName } });
      find.mockResolvedValue({
        enabled: true,
        offsetMinutes: -minutesBeforeDeparture,
      });
      const departure = new Date("2026-11-20T15:30:00+09:00");

      await service.reserveIfEligible(
        { pk: "pot", routePk } as Pot,
        departure,
        tx,
      );

      expect(deleteByPotFkAndType).toHaveBeenCalledWith(
        "pot",
        "popo-delay-check-request-v1",
        tx,
      );
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          potFk: "pot",
          popoChatMsgType: "popo-delay-check-request-v1",
          sendAfter: new Date(`2026-11-20T${sendTime}:00+09:00`),
          formatArguments: {
            stationName,
            departureTime: departure.toISOString(),
          },
        }),
        tx,
      );
    },
  );

  it("makes a late reservation ready immediately", async () => {
    getRouteById.mockReturnValue({ fromStop: { nameKor: "광주송정역" } });
    await service.reserveIfEligible(
      { pk: "pot", routePk: "songjeong" } as Pot,
      new Date("2026-11-20T15:05:00+09:00"),
      tx,
    );
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ sendAfter: now }),
      tx,
    );
  });

  it.each([
    ["other", true],
    ["songjeong", false],
  ])(
    "skips route %s with enabled=%s when ineligible",
    async (routePk, enabled) => {
      getRouteById.mockReturnValue({ fromStop: { nameKor: "광주송정역" } });
      find.mockResolvedValue({ enabled, offsetMinutes: -10 });
      await service.reserveIfEligible(
        { pk: "pot", routePk } as Pot,
        new Date("2026-11-20T15:30:00+09:00"),
        tx,
      );
      expect(insert).not.toHaveBeenCalled();
    },
  );
});
