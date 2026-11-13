import { ApiProperty } from "@nestjs/swagger";
export class PotEventDepartureConfirmV1Dto {
  @ApiProperty({ type: String })
  user_pk: string;
  @ApiProperty({ type: Date })
  departure_time: Date;
}
