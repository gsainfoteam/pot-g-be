import { BadRequestException, NotFoundException } from "@nestjs/common";
import { AdminFofoMessageService } from "./admin-fofo-message.service";

describe("AdminFofoMessageService.update", () => {
  const findByType = jest.fn();
  const update = jest.fn();
  const reloadFofoChatMsgs = jest.fn();
  const service = new AdminFofoMessageService(
    {
      db: { transaction: (fn: (tx: unknown) => unknown) => fn({}) },
    } as any,
    { findByType, update } as any,
    { reloadFofoChatMsgs } as any,
  );

  const entity = (type: string, offsetMinutes: number | null) => ({
    type,
    actionBtns: [],
    message: "old",
    enabled: true,
    offsetMinutes,
    updatedAt: new Date(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    update.mockImplementation(async (e) => e);
  });

  it("rejects inherited object keys as an unknown type", async () => {
    await expect(
      service.update("constructor", { message: "m", enabled: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(findByType).not.toHaveBeenCalled();
  });

  it("rejects a message that mixes auto-numbered and named placeholders", async () => {
    findByType.mockResolvedValue(entity("popo-auto-archive-v1", 10));
    await expect(
      service.update("popo-auto-archive-v1", {
        message: "{} and {name}",
        enabled: true,
        offset_minutes: 10,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a non-negative offset for delay check messages", async () => {
    findByType.mockResolvedValue(entity("popo-delay-check-request-v1", -10));
    await expect(
      service.update("popo-delay-check-request-v1", {
        message: "{stationName} {departureTime}",
        enabled: true,
        offset_minutes: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("saves and reloads the cache", async () => {
    findByType.mockResolvedValue(entity("popo-delay-check-request-v1", -10));
    const result = await service.update("popo-delay-check-request-v1", {
      message: "{stationName} {departureTime}",
      enabled: false,
      offset_minutes: -20,
    });
    expect(result.offset_minutes).toBe(-20);
    expect(reloadFofoChatMsgs).toHaveBeenCalled();
  });
});
