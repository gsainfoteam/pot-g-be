import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RouteDto } from "@src/discovery/dto/route.dto";

export class PotDetailDto {
  @ApiProperty({ type: String, description: "Pot ID" })
  id: string; // Pot ID
  @ApiProperty({ type: String, description: "Pot 이름" })
  name: string; // Pot 이름
  @ApiProperty({ type: () => RouteDto, description: "노선" })
  route: RouteDto; // 노선
  @ApiProperty({ type: String, description: "출발 가능 시작 시간" })
  starts_at: string; // 출발 가능 시작 시간
  @ApiProperty({ type: String, description: "출발 가능 종료 시간" })
  ends_at: string; // 출발 가능 종료 시간
  @ApiPropertyOptional({
    type: String,
    description: "확정 출발 시간 (출발 시간이 확정된 경우)",
  })
  departure_time?: string; // 확정 출발 시간 (출발 시간이 확정된 경우)
  @ApiProperty({ type: Number, description: "현재 인원" })
  current: number; // 현재 인원
  @ApiProperty({ type: Number, description: "최대 인원" })
  total: number; // 최대 인원
  @ApiProperty({ type: String, description: "현재 팟의 상태" })
  status: string; // 현재 팟의 상태
  @ApiPropertyOptional({
    type: Number,
    description: "정산 요청을 받은 경우, 그 금액",
  })
  accounting_requested?: number; // 정산 요청을 받은 경우, 그 금액
}
