import { RouteDto } from "@src/discovery/dto/route.dto";

export class PotDetailDto {
  id: string; // Pot ID
  name: string; // Pot 이름
  route: RouteDto; // 노선
  starts_at: string; // 출발 가능 시작 시간
  ends_at: string; // 출발 가능 종료 시간
  departure_time?: string; // 확정 출발 시간 (출발 시간이 확정된 경우)
  current: number; // 현재 인원
  total: number; // 최대 인원
  status: string; // 현재 팟의 상태
  accounting_requested?: number; // 정산 요청을 받은 경우, 그 금액
}
