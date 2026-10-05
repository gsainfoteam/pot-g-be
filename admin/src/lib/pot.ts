export const POT_STATUS_LABEL: Record<string, string> = {
  BEFORE_CONFIRMED: "출발 확정 전",
  CONFIRMED: "출발 확정",
  DEPARTED: "출발함 (정산 요청 전)",
  WAIT_ACCOUNTING: "정산 대기 중",
  ACCOUNTING_DONE: "정산 완료",
  ARCHIVED: "해산됨",
  DELETED: "삭제됨",
};

export const EVENT_TYPE_LABEL: Record<string, string> = {
  create_v1: "팟 생성",
  popo_chat_v1: "시스템 메시지",
  user_in_v1: "참여",
  user_leave_v1: "퇴장",
  user_kick_v1: "강퇴",
  departure_confirm_v1: "출발 확정",
  accounting_request_v1: "정산 요청",
  accounting_confirm_v1: "정산 확인",
  archive_v1: "해산",
};
