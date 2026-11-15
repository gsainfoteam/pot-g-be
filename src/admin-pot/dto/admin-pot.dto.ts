import { ApiProperty } from "@nestjs/swagger";
export type AdminPotStatus =
  | "BEFORE_CONFIRMED" // 출발 확정 전
  | "CONFIRMED" // 출발 확정 후, 출발 전
  | "DEPARTED" // 출발 시간이 지났지만 정산 요청 전
  | "WAIT_ACCOUNTING" // 정산 대기 중
  | "ACCOUNTING_DONE" // 정산 완료
  | "ARCHIVED" // 해산됨
  | "DELETED"; // 삭제됨

export class AdminPotDto {
  @ApiProperty({ type: String })
  pk: string;
  @ApiProperty({ type: String })
  name: string;
  @ApiProperty({ type: String })
  route_name: string;
  @ApiProperty({
    enum: [
      "BEFORE_CONFIRMED",
      "CONFIRMED",
      "DEPARTED",
      "WAIT_ACCOUNTING",
      "ACCOUNTING_DONE",
      "ARCHIVED",
      "DELETED",
    ],
  })
  status: AdminPotStatus;
  @ApiProperty({ type: Number })
  current: number;
  @ApiProperty({ type: Number })
  total: number;
  @ApiProperty({ type: Date })
  starts_at: Date;
  @ApiProperty({ type: Date })
  ends_at: Date;
  @ApiProperty({ type: Date, nullable: true })
  departure_time: Date | null;
  @ApiProperty({ type: Date })
  created_at: Date;
}
