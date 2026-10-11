export type AdminPotStatus =
  | "BEFORE_CONFIRMED" // 출발 확정 전
  | "CONFIRMED" // 출발 확정 후, 출발 전
  | "DEPARTED" // 출발 시간이 지났지만 정산 요청 전
  | "WAIT_ACCOUNTING" // 정산 대기 중
  | "ACCOUNTING_DONE" // 정산 완료
  | "ARCHIVED" // 해산됨
  | "DELETED"; // 삭제됨

export class AdminPotDto {
  pk: string;
  name: string;
  route_name: string;
  status: AdminPotStatus;
  current: number;
  total: number;
  starts_at: Date;
  ends_at: Date;
  departure_time: Date | null;
  created_at: Date;
}
