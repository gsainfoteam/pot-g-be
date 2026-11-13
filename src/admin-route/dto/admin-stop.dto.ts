import { ApiProperty } from "@nestjs/swagger";
export class AdminStopDto {
  @ApiProperty({ type: String })
  pk: string;
  @ApiProperty({ type: String })
  name_kor: string;
  @ApiProperty({ type: String })
  name_eng: string;
  @ApiProperty({ type: Number })
  lat: number;
  @ApiProperty({ type: Number })
  lng: number;
}
