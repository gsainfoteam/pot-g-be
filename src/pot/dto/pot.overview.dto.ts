import { ApiProperty } from "@nestjs/swagger";
import { RouteDto } from "@src/discovery/dto/route.dto";
import { PotUsersInfoDto } from "@src/pot/dto/pot.info.dto";

export class PotOverviewDto {
  @ApiProperty({ type: String })
  id: string;
  @ApiProperty({ type: String })
  name: string;
  @ApiProperty({ type: () => RouteDto })
  route: RouteDto;
  @ApiProperty({ type: String })
  starts_at: string;
  @ApiProperty({ type: String })
  ends_at: string;
  @ApiProperty({ type: () => PotUsersInfoDto })
  users_info: PotUsersInfoDto;
}
