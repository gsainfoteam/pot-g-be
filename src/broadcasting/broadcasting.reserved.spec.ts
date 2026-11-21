import { Logger } from "@nestjs/common";
import { BroadcastingService } from "./broadcasting.service";

describe("reserved notification failure reporting", () => {
  const event = {
    pot_pk: "pot",
    timestamp: 1,
    id: 1,
    event_type: "popo_chat_v1",
    data: {
      popo_chat_type: "popo-reminder-taxi-call-v1",
      content: "Taxi reminder",
      action_btns: [],
    },
  };

  function setup(errorCode?: string) {
    const fcm = {
      sendBulkPushNotification: jest.fn().mockResolvedValue({
        results: [{ success: !errorCode, errorCode }],
      }),
    };
    const service = new BroadcastingService(
      { findClientByUserId: jest.fn().mockReturnValue([]) } as any,
      fcm as any,
      {
        findFcmTokensByUserFks: jest
          .fn()
          .mockResolvedValue([
            {
              userFk: "user",
              devicePk: "device",
              deviceId: "device",
              fcmToken: "test-token",
              chatPush: true,
            },
          ]),
      } as any,
    );
    return { service, fcm };
  }

  beforeEach(() => {
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it("reports transient FCM failures to the durable delivery worker", async () => {
    const { service } = setup("messaging/server-unavailable");
    await expect(
      service.broadcastPotEvent(event, ["user"], "Pot", undefined, true),
    ).rejects.toThrow("not accepted by FCM");
  });

  it("finishes deliveries with permanently invalid registration tokens", async () => {
    const { service } = setup("messaging/registration-token-not-registered");
    await expect(
      service.broadcastPotEvent(event, ["user"], "Pot", undefined, true),
    ).resolves.toBeUndefined();
  });

  it("retains the default failure handling of existing immediate callers", async () => {
    const { service } = setup("messaging/server-unavailable");
    await expect(
      service.broadcastPotEvent(event, ["user"], "Pot"),
    ).resolves.toBeUndefined();
  });

  it("reports thrown network errors to the durable delivery worker", async () => {
    const { service, fcm } = setup();
    fcm.sendBulkPushNotification.mockRejectedValueOnce(
      new Error("network down"),
    );
    await expect(
      service.broadcastPotEvent(event, ["user"], "Pot", undefined, true),
    ).rejects.toThrow("network down");
  });
});
