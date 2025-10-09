import { RouteDto } from "@src/discovery/dto/route.dto";
import { PotUsersInfoDto } from "@src/pot/dto/pot.info.dto";

export class PotOverviewDto {
  id: string;
  name: string;
  route: RouteDto;
  starts_at: Date;
  ends_at: Date;
  users_info: PotUsersInfoDto;
}
