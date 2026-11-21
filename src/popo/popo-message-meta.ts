import { PopoChatStringType } from "../../drizzle/schema/popo-chat-msg";

/**
 * 발송 시점 오프셋(popo_chat_msg.offset_minutes)의 기준 시각.
 * 어떤 시각을 기준으로 삼는지는 예약 로직에 속하므로 DB가 아니라 코드에서 정한다.
 */
export type PopoTimingAnchor =
  | "departure_available_start"
  | "departure_available_end"
  | "departure_time"
  | "accounting_completed";

export type PopoMessageVariable = {
  name: string;
  description: string;
};

export type PopoMessageMeta = {
  title: string;
  /** 발송 조건과 흐름 설명. 어드민 페이지에 읽기 전용으로 표시한다. */
  description: string;
  /** null 이면 이벤트 발생 즉시 발송되는 메시지로, 발송 시점을 바꿀 수 없다. */
  timingAnchor: PopoTimingAnchor | null;
  /** 문구에서 {name} 형태로 사용할 수 있는 변수 */
  variables: PopoMessageVariable[];
};

// Record 타입이라 popo_chat_type enum 에 값을 추가하면 이곳도 채워야 컴파일된다.
export const POPO_MESSAGE_META: Record<PopoChatStringType, PopoMessageMeta> = {
  "popo-departure-confirm-request-v1": {
    title: "출발 시간 확정 요청",
    description:
      "팟 생성 시 예약됩니다. 출발 가능 시작 시각까지 남은 시간이 발송 시점보다 짧은 팟은 예약 없이 즉시 발송됩니다. 출발 시간이 확정되면 예약이 취소됩니다.",
    timingAnchor: "departure_available_start",
    variables: [
      {
        name: "departureTimeEndsAt",
        description: "출발 시간 확정 마감 시각 (예: 11월 21일 오후 3시 0분)",
      },
    ],
  },
  "popo-auto-archive-no-departure-confirm-v1": {
    title: "출발 미확정 자동 해산 안내",
    description:
      "팟 생성 시 예약됩니다. 출발 시간이 확정되면 예약이 취소됩니다. 발송 시점에 팟이 해산됩니다. 발송을 끄더라도 팟 해산은 그대로 진행됩니다.",
    timingAnchor: "departure_available_end",
    variables: [],
  },
  "popo-departure-confirmed-v1": {
    title: "출발 시간 확정 안내",
    description: "출발 시간이 확정되는 즉시 발송됩니다.",
    timingAnchor: null,
    variables: [
      {
        name: "departureTimeEndsAt",
        description: "확정된 출발 시각 (예: 11월 21일 오후 3시 0분)",
      },
    ],
  },
  "popo-reminder-taxi-call-v1": {
    title: "택시 호출 리마인더",
    description:
      "출발 시간이 확정되면 예약됩니다. 확정 시점이 이미 발송 시점을 지났다면 즉시 발송됩니다. 문구의 {remainDepartureTime}에는 출발까지 남은 분이 들어갑니다.",
    timingAnchor: "departure_time",
    variables: [
      {
        name: "remainDepartureTime",
        description: "출발까지 남은 시간(분)",
      },
    ],
  },
  "popo-delay-check-request-v1": {
    title: "지연 확인 요청",
    description:
      "출발 시간이 확정되면 예약됩니다. 지연 확인 대상 노선의 팟에만 적용됩니다.",
    timingAnchor: "departure_time",
    variables: [
      { name: "stationName", description: "출발 정류장 이름" },
      { name: "departureTime", description: "출발 시각 (ISO 8601)" },
    ],
  },
  "popo-accounting-reminder-v1": {
    title: "정산 요청 리마인더",
    description:
      "출발 시간이 확정되면 예약됩니다. 결제자가 정산을 요청하면 예약이 취소됩니다.",
    timingAnchor: "departure_time",
    variables: [],
  },
  "popo-accounting-request-v1": {
    title: "정산 요청 안내",
    description:
      "결제자가 정산을 요청하는 즉시 발송됩니다. 총액이 0원이거나 요청 인원이 0명이면 바로 정산 완료로 처리되어 발송되지 않습니다.",
    timingAnchor: null,
    variables: [
      { name: "totalNum", description: "정산 요청 인원 수" },
      { name: "totalCost", description: "총 금액(원)" },
      { name: "costPerUser", description: "1인당 금액(원)" },
    ],
  },
  "popo-auto-archive-accounting-fin-v1": {
    title: "정산 완료 안내",
    description: "참여자 전원이 정산을 완료하는 즉시 발송됩니다.",
    timingAnchor: null,
    variables: [],
  },
  "popo-auto-archive-v1": {
    title: "정산 완료 후 자동 해산 안내",
    description:
      "참여자 전원이 정산을 완료하면 예약됩니다. 발송 시점에 팟이 해산됩니다. 발송을 끄더라도 팟 해산은 그대로 진행됩니다.",
    timingAnchor: "accounting_completed",
    variables: [],
  },
};
