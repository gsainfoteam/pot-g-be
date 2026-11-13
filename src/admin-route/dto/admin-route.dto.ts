import { ApiProperty } from "@nestjs/swagger";
import { AdminStopDto } from "@src/admin-route/dto/admin-stop.dto";

export class AdminRouteDto {
  @ApiProperty({ type: String })
  pk: string;
  @ApiProperty({ type: String })
  short_name_kor: string;
  @ApiProperty({ type: String })
  short_name_eng: string;
  @ApiProperty({ type: Boolean })
  is_deleted: boolean;
  @ApiProperty({ type: () => AdminStopDto })
  from_stop: AdminStopDto;
  @ApiProperty({ type: () => AdminStopDto })
  to_stop: AdminStopDto;
}
