import { BroadcastingService } from "./broadcasting.service";
import { DeliveryUserProgress } from "../../drizzle/schema/fofo-chat-delivery";

describe("durable reserved notification channels", () => {
  const event = {
    pot_pk: "pot",
    timestamp: 1,
    id: 7,
    event_type: "popo_chat_v1",
    data: { content: "Reminder" },
  };
  const device = (userFk: string, devicePk: string) => ({
    userFk,
    devicePk,
    deviceId: devicePk,
    fcmToken: `token-${devicePk}`,
    chatPush: true,
  });

  function setup(devices = [device("user", "a")]) {
    const websocket = { findClientByUserId: jest.fn().mockReturnValue([]) };
    const fcm = {
      sendBulkPushNotification: jest
        .fn()
        .mockImplementation(async ({ fcmTokens }) => ({
          results: fcmTokens.map(() => ({ success: true })),
        })),
    };
    const repository = {
      findFcmTokensByUserFks: jest.fn(async (pks: string[]) =>
        devices.filter((d) => pks.includes(d.userFk)),
      ),
    };
    const service = new BroadcastingService(
      websocket as any,
      fcm as any,
      repository as any,
    );
    let stored: Record<string, DeliveryUserProgress> = {};
    const progress: Record<string, DeliveryUserProgress> = {};
    const save = jest.fn(async () => {
      stored = structuredClone(progress);
    });
    const client = {
      getIsAuthorized: jest.fn().mockReturnValue(true),
      sendMessage: jest.fn(),
      addMessageToQueue: jest.fn(),
      findAckMessage: jest.fn(),
    };
    return {
      service,
      websocket,
      fcm,
      repository,
      progress,
      save,
      client,
      stored: () => stored,
    };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-11-21T00:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

  it("persists ACK fallback, retries its FCM failure, and never repeats WS", async () => {
    const { service, websocket, fcm, progress, save, client, stored } = setup();
    websocket.findClientByUserId.mockReturnValue([client]);
    const next = await service.broadcastReservedPotEvent(
      event,
      ["user"],
      "Pot",
      progress,
      save,
    );
    expect(next.getTime()).toBe(Date.now() + 10_000);
    expect(stored().user.stage).toBe("ack");
    expect(fcm.sendBulkPushNotification).not.toHaveBeenCalled();
    jest.advanceTimersByTime(10_000);
    fcm.sendBulkPushNotification.mockResolvedValueOnce({
      results: [{ success: false, errorCode: "messaging/server-unavailable" }],
    });
    await service.broadcastReservedPotEvent(
      event,
      ["user"],
      "Pot",
      progress,
      save,
    );
    expect(stored().user).toEqual({ stage: "push", pendingDevicePks: ["a"] });
    // Restore only persisted state, as a restarted worker would.
    const restored = stored();
    await service.broadcastReservedPotEvent(
      event,
      ["user"],
      "Pot",
      restored,
      async () => undefined,
    );
    expect(restored.user).toEqual({ stage: "done" });
    expect(client.sendMessage).toHaveBeenCalledTimes(1);
    expect(fcm.sendBulkPushNotification).toHaveBeenCalledTimes(2);
  });

  it("skips fallback after ACK while retrying a different recipient's push", async () => {
    const { service, websocket, fcm, progress, save, client } = setup([
      device("offline", "b"),
    ]);
    websocket.findClientByUserId.mockImplementation((pk) =>
      pk === "online" ? [client] : [],
    );
    fcm.sendBulkPushNotification.mockResolvedValueOnce({
      results: [{ success: false }],
    });
    await service.broadcastReservedPotEvent(
      event,
      ["online", "offline"],
      "Pot",
      progress,
      save,
    );
    jest.advanceTimersByTime(60_000);
    client.findAckMessage.mockReturnValue({});
    await service.broadcastReservedPotEvent(
      event,
      ["online", "offline"],
      "Pot",
      progress,
      save,
    );
    expect(progress.online).toEqual({ stage: "done" });
    expect(client.sendMessage).toHaveBeenCalledTimes(1);
    expect(client.findAckMessage).toHaveBeenLastCalledWith(
      client.sendMessage.mock.calls[0][0].request_id,
      "pot_event_receive_res",
    );
    expect(
      fcm.sendBulkPushNotification.mock.calls.map(
        ([payload]) => payload.fcmTokens,
      ),
    ).toEqual([["token-b"], ["token-b"]]);
  });

  it("retries only transiently failed devices after partial success", async () => {
    const { service, fcm, progress, save, stored } = setup([
      device("user", "a"),
      device("user", "b"),
      device("user", "c"),
    ]);
    fcm.sendBulkPushNotification.mockResolvedValueOnce({
      results: [
        { success: true },
        { success: false, errorCode: "messaging/server-unavailable" },
        {
          success: false,
          errorCode: "messaging/registration-token-not-registered",
        },
      ],
    });
    await service.broadcastReservedPotEvent(
      event,
      ["user"],
      "Pot",
      progress,
      save,
    );
    expect(stored().user).toEqual({ stage: "push", pendingDevicePks: ["b"] });
    await service.broadcastReservedPotEvent(
      event,
      ["user"],
      "Pot",
      stored(),
      async () => undefined,
    );
    expect(fcm.sendBulkPushNotification.mock.calls[1][0].fcmTokens).toEqual([
      "token-b",
    ]);
  });

  it("retains pending devices if FCM throws after ACK timeout", async () => {
    const { service, fcm, progress, save, stored } = setup();
    progress.user = {
      stage: "ack",
      requestId: "original",
      checkAfter: Date.now() - 1,
    };
    fcm.sendBulkPushNotification.mockRejectedValueOnce(new Error("offline"));
    await expect(
      service.broadcastReservedPotEvent(event, ["user"], "Pot", progress, save),
    ).rejects.toThrow("offline");
    expect(stored().user).toEqual({ stage: "push", pendingDevicePks: ["a"] });
  });

  it("respects current device preferences during retry", async () => {
    const devices = [device("user", "a")];
    const { service, fcm, progress, save } = setup(devices);
    progress.user = { stage: "push", pendingDevicePks: ["a"] };
    devices[0].chatPush = false;
    await service.broadcastReservedPotEvent(
      event,
      ["user"],
      "Pot",
      progress,
      save,
    );
    expect(progress.user).toEqual({ stage: "done" });
    expect(fcm.sendBulkPushNotification).not.toHaveBeenCalled();
  });

  it("does not send after expiry or queue across reauthorization", async () => {
    const { service, websocket, fcm, progress, save, client } = setup();
    websocket.findClientByUserId.mockReturnValue([client]);
    await service.broadcastReservedPotEvent(
      event,
      ["user"],
      "Pot",
      progress,
      save,
      new Date(),
    );
    expect(client.sendMessage).not.toHaveBeenCalled();
    expect(fcm.sendBulkPushNotification).not.toHaveBeenCalled();
    client.getIsAuthorized.mockReturnValue(false);
    await service.broadcastReservedPotEvent(
      event,
      ["user"],
      "Pot",
      progress,
      save,
    );
    expect(client.addMessageToQueue).not.toHaveBeenCalled();
    expect(progress.user.stage).toBe("ack");
  });

  it("checkpoints WS before sending so a send exception cannot replay it", async () => {
    const { service, websocket, progress, save, client, stored } = setup();
    websocket.findClientByUserId.mockReturnValue([client]);
    client.sendMessage.mockImplementationOnce(() => {
      throw new Error("socket closed");
    });
    await expect(
      service.broadcastReservedPotEvent(event, ["user"], "Pot", progress, save),
    ).rejects.toThrow("socket closed");
    expect(stored().user.stage).toBe("ack");
    await service.broadcastReservedPotEvent(
      event,
      ["user"],
      "Pot",
      stored(),
      async () => undefined,
    );
    expect(client.sendMessage).toHaveBeenCalledTimes(1);
  });
});
