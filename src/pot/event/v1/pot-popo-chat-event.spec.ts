import { PotEventFactory } from "../pot-event";
import { PotPopoChatEventV1 } from "./pot-popo-chat-event";

describe("Popo v1 event compatibility", () => {
  it.each([
    "popo-reminder-taxi-call-v1",
    "popo-delay-check-request-v1",
    "fofo-delay-check-request-v1",
  ])("replays %s without changing its stored or public payload", (type) => {
    const timestamp = new Date("2026-11-23T00:00:00Z");
    const stored = {
      id: 42,
      potFk: "00000000-0000-0000-0000-000000000001",
      type: "popo_chat_v1" as const,
      timestamp,
      data: {
        popoChatType: type,
        message: "출발 {remainDepartureTime}분 전입니다.",
        actionBtns: ["taxi-call-btn"],
        timestamp: timestamp.toISOString(),
        formatArguments: { remainDepartureTime: 10 },
      },
    };
    const event = PotEventFactory.toModel(stored);

    expect(event).toBeInstanceOf(PotPopoChatEventV1);
    expect(event.id).toBe(42);
    expect(event.eventType).toBe("popo_chat_v1");
    expect(event.toDto()).toEqual({
      popo_chat_type: type,
      content: "출발 10분 전입니다.",
      action_btns: ["taxi-call-btn"],
    });
    expect(PotEventFactory.toEntity(event).data).toEqual({
      ...stored.data,
      timestamp: expect.any(Date),
    });
  });
});
