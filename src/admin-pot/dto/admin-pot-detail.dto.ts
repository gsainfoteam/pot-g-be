import { ApiProperty } from "@nestjs/swagger";
import { AdminPotStatus } from "@src/admin-pot/dto/admin-pot.dto";

export class AdminPotEventDto {
  @ApiProperty({ type: Number })
  id: number;
  @ApiProperty({ type: Date })
  timestamp: Date;
  @ApiProperty({ type: String })
  event_type: string;
  @ApiProperty({ type: Object })
  data: unknown;
}

export class AdminPotAccountingDto {
  @ApiProperty({ type: String, nullable: true })
  requested_by_user_pk: string | null;
  @ApiProperty({ type: Number, nullable: true })
  total_cost: number | null;
  @ApiProperty({ type: Number, nullable: true })
  cost_per_user: number | null;
  @ApiProperty({ type: String, nullable: true })
  bank_name: string | null;
  @ApiProperty({
    type: String,
    isArray: true,
    description: "아직 송금하지 않은 유저",
  })
  pending_user_pks: string[]; // 아직 송금하지 않은 유저
  @ApiProperty({
    type: String,
    isArray: true,
    description: "송금을 확인받은 유저",
  })
  confirmed_user_pks: string[]; // 송금을 확인받은 유저
}

export class AdminPotDetailDto {
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
  @ApiProperty({ type: Boolean })
  is_archived: boolean;
  @ApiProperty({ type: Boolean })
  is_deleted: boolean;
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
  @ApiProperty({ type: Date })
  updated_at: Date;
  @ApiProperty({ type: String, nullable: true })
  host_user_pk: string | null;
  @ApiProperty({ type: String, isArray: true })
  joined_user_pks: string[];
  @ApiProperty({ type: () => AdminPotAccountingDto, nullable: true })
  accounting: AdminPotAccountingDto | null;
  @ApiProperty({
    type: Object,
    additionalProperties: { type: "string" },
    description: "user pk -> 이름",
  })
  users: Record<string, string>; // user pk -> 이름
  @ApiProperty({
    type: () => AdminPotEventDto,
    isArray: true,
    description: "채팅 제외",
  })
  events: AdminPotEventDto[]; // 채팅 제외
}
