import { RouteDto } from "@src/discovery/dto/route.dto";
import { PotUsersInfoDto } from "@src/pot/dto/pot.info.dto";

export class PotOverviewDto {
  id: string;
  name: string;
  route: RouteDto;
  starts_at: string;
  ends_at: string;
  users_info: PotUsersInfoDto;
}
