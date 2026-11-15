import { ApiProperty } from "@nestjs/swagger";
import { RouteDto } from "@src/discovery/dto/route.dto";

export class PotDto {
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
  @ApiProperty({ type: Number })
  current: number;
  @ApiProperty({ type: Number })
  total: number;
}
