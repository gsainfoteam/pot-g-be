import { Subject } from "rxjs";
import { Logger } from "@nestjs/common";
import { FofoSchedulerService } from "./fofo.scheduler.service";
import { FofoService } from "./fofo.service";
import { FofoChatReservationRepository } from "@src/database/repository/fofo-chat-reservation.repository";
import { FofoChatReservationEntity } from "@src/database/entity/fofo-chat-reservation.entity";
import { SlackService } from "nestjs-slack";

describe("FofoSchedulerService reservation recovery", () => {
  const initialTime = new Date("2026-11-20T00:02:00Z");
  let scheduler: FofoSchedulerService;

  function reservation(pk: string, minutes: number): FofoChatReservationEntity {
    return {
      pk,
      potFk: "pot-1",
      fofoChatMsgType: "popo-reminder-taxi-call-v1",
      sendAfter: new Date(Date.now() + minutes * 60_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  function setup(rows: FofoChatReservationEntity[] = []) {
    const service = {
      reservationCreated$: new Subject<FofoChatReservationEntity>(),
      reservationsCancelled$: new Subject<{ potPk: string; type?: string }>(),
      processReservedFofoChatReservation: jest
        .fn()
        .mockResolvedValue(undefined),
      processPendingDeliveries: jest.fn().mockResolvedValue(undefined),
    };
    const repository = {
      findAllScheduledBefore: jest.fn(async (until: Date) =>
        rows.filter((row) => row.sendAfter <= until),
      ),
    };
    const slack = { sendText: jest.fn().mockResolvedValue(undefined) };
    scheduler = new FofoSchedulerService(
      service as unknown as FofoService,
      slack as unknown as SlackService,
      repository as unknown as FofoChatReservationRepository,
    );
    return { service, repository, slack };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(initialTime);
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });
  afterEach(async () => {
    await scheduler?.onModuleDestroy();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("recovers overdue work at startup and waits for upcoming due times", async () => {
    const { service, repository } = setup([
      reservation("overdue", -1),
      reservation("soon", 2),
      reservation("far", 8),
    ]);
    await scheduler.onApplicationBootstrap();
    expect(repository.findAllScheduledBefore).toHaveBeenCalledWith(
      new Date(initialTime.getTime() + 5 * 60_000),
    );
    expect(service.processReservedFofoChatReservation).toHaveBeenCalledTimes(1);
    expect(service.processReservedFofoChatReservation).toHaveBeenCalledWith(
      "overdue",
    );
    expect(service.processPendingDeliveries).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(1);
    await jest.advanceTimersByTimeAsync(119_999);
    expect(service.processReservedFofoChatReservation).not.toHaveBeenCalledWith(
      "soon",
    );
    await jest.advanceTimersByTimeAsync(1);
    expect(service.processReservedFofoChatReservation).toHaveBeenCalledWith(
      "soon",
    );
    expect(service.processReservedFofoChatReservation).not.toHaveBeenCalledWith(
      "far",
    );
  });

  it("loads distant reservations when the next five-minute refresh reaches them", async () => {
    const row = reservation("far", 8);
    const { service } = setup([row]);
    await scheduler.onApplicationBootstrap();
    expect(jest.getTimerCount()).toBe(0);
    await jest.advanceTimersByTimeAsync(5 * 60_000);
    await scheduler.handleCron();
    expect(jest.getTimerCount()).toBe(1);
    await jest.advanceTimersByTimeAsync(3 * 60_000);
    expect(service.processReservedFofoChatReservation).toHaveBeenCalledWith(
      "far",
    );
  });

  it("registers newly committed imminent reservations between cron runs", async () => {
    const { service } = setup();
    await scheduler.onApplicationBootstrap();
    service.reservationCreated$.next(reservation("new", 1));
    await jest.advanceTimersByTimeAsync(60_000);
    expect(service.processReservedFofoChatReservation).toHaveBeenCalledWith(
      "new",
    );
  });

  it("does not duplicate timers when cron refresh overlaps registered work", async () => {
    const row = reservation("same", 2);
    const { service } = setup([row]);
    await scheduler.onApplicationBootstrap();
    await scheduler.handleCron();
    service.reservationCreated$.next(row);
    expect(jest.getTimerCount()).toBe(1);
    await jest.advanceTimersByTimeAsync(2 * 60_000);
    expect(service.processReservedFofoChatReservation).toHaveBeenCalledTimes(1);
  });

  it("removes cancelled timers and handles a reservation moved outside the window", async () => {
    const { service } = setup();
    await scheduler.onApplicationBootstrap();
    service.reservationCreated$.next(reservation("cancelled", 1));
    service.reservationsCancelled$.next({
      potPk: "pot-1",
      type: "popo-reminder-taxi-call-v1",
    });
    expect(jest.getTimerCount()).toBe(0);
    service.reservationCreated$.next(reservation("moved", 1));
    service.reservationCreated$.next(reservation("moved", 8));
    expect(jest.getTimerCount()).toBe(0);
    await jest.advanceTimersByTimeAsync(60_000);
    expect(service.processReservedFofoChatReservation).not.toHaveBeenCalled();
  });

  it("clears in-memory timers on shutdown and rebuilds them from DB after restart", async () => {
    const row = reservation("restart", 2);
    setup([row]);
    await scheduler.onApplicationBootstrap();
    await scheduler.onModuleDestroy();
    expect(jest.getTimerCount()).toBe(0);
    await jest.advanceTimersByTimeAsync(3 * 60_000);
    const { service } = setup([row]);
    await scheduler.onApplicationBootstrap();
    expect(service.processReservedFofoChatReservation).toHaveBeenCalledWith(
      "restart",
    );
  });

  it("retains failed DB work for a later refresh", async () => {
    const { service } = setup([reservation("retry", -1)]);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    service.processReservedFofoChatReservation.mockRejectedValueOnce(
      new Error("DB unavailable"),
    );
    await scheduler.onApplicationBootstrap();
    await scheduler.handleCron();
    expect(service.processReservedFofoChatReservation).toHaveBeenCalledTimes(2);
  });

  it("waits for active processing while shutting down", async () => {
    const { service } = setup();
    await scheduler.onApplicationBootstrap();
    let complete: () => void;
    service.processReservedFofoChatReservation.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve;
        }),
    );
    service.reservationCreated$.next(reservation("running", 0));
    await jest.advanceTimersByTimeAsync(1);
    let stopped = false;
    const stop = scheduler.onModuleDestroy().then(() => {
      stopped = true;
    });
    await Promise.resolve();
    expect(stopped).toBe(false);
    complete();
    await stop;
    expect(stopped).toBe(true);
  });
});
