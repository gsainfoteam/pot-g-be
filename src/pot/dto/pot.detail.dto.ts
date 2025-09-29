import { RouteDto } from "@src/discovery/dto/route.dto";

export class PotDetailDto {
  id: string; // Pot ID
  name: string; // Pot 이름
  route: RouteDto; // 노선
  starts_at: Date; // 출발 가능 시작 시간
  ends_at: Date; // 출발 가능 종료 시간
  departure_time?: Date; // 확정 출발 시간 (출발 시간이 확정된 경우)
  current: number; // 현재 인원
  total: number; // 최대 인원
  status: string; // 현재 팟의 상태
  last_chat_timestamp: number; // 마지막 대화의 타임스탬프
  accounting_requested: number; // 정산 요청을 받은 경우, 그 금액
}
