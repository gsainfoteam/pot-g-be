import { ApiProperty } from "@nestjs/swagger";
export class PotEventCreateV1Dto {
  @ApiProperty({ type: String })
  created_by: string;
}
