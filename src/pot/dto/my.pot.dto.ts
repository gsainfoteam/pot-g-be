import { ApiProperty } from "@nestjs/swagger";
import { PotDetailDto } from "@src/pot/dto/pot.detail.dto";

export class MyPotResDto {
  @ApiProperty({ type: () => PotDetailDto, isArray: true })
  pot_list: PotDetailDto[];
  @ApiProperty({ type: () => PotDetailDto, isArray: true })
  archived_pot_list: PotDetailDto[];
}
