import { AdminStopDto } from "@src/admin-route/dto/admin-stop.dto";

export class AdminRouteDto {
  pk: string;
  short_name_kor: string;
  short_name_eng: string;
  from_stop: AdminStopDto;
  to_stop: AdminStopDto;
}
