import { ApiProperty } from "@nestjs/swagger";
export class PotEventUserInV1Dto {
  @ApiProperty({ type: String })
  user_pk: string;
}
