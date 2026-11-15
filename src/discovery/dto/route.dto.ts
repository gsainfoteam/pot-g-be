import { ApiProperty } from "@nestjs/swagger";
import { StopDto } from "@src/discovery/dto/stop.dto";

export class RouteDto {
  @ApiProperty({ type: String })
  id: string;
  @ApiProperty({ type: () => StopDto })
  from: StopDto;
  @ApiProperty({ type: () => StopDto })
  to: StopDto;
}
