import { ApiProperty } from "@nestjs/swagger";
export class PotEventUserKickV1Dto {
  @ApiProperty({ type: String })
  host_user_pk: string;
  @ApiProperty({ type: String })
  kicked_user_pk: string;
}
