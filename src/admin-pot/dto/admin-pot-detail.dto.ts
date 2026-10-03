import { AdminPotStatus } from "@src/admin-pot/dto/admin-pot.dto";

export class AdminPotEventDto {
  id: number;
  timestamp: Date;
  event_type: string;
  data: unknown;
}

export class AdminPotAccountingDto {
  requested_by_user_pk: string | null;
  total_cost: number | null;
  cost_per_user: number | null;
  bank_name: string | null;
  pending_user_pks: string[]; // 아직 송금하지 않은 유저
  confirmed_user_pks: string[]; // 송금을 확인받은 유저
}

export class AdminPotDetailDto {
  pk: string;
  name: string;
  route_name: string;
  status: AdminPotStatus;
  is_archived: boolean;
  is_deleted: boolean;
  total: number;
  starts_at: Date;
  ends_at: Date;
  departure_time: Date | null;
  created_at: Date;
  updated_at: Date;
  host_user_pk: string | null;
  joined_user_pks: string[];
  accounting: AdminPotAccountingDto | null;
  users: Record<string, string>; // user pk -> 이름
  events: AdminPotEventDto[]; // 채팅 제외
}
