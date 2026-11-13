import { ApiProperty } from "@nestjs/swagger";
export class PotEventChatV1Dto {
  @ApiProperty({ type: String })
  from: string;
  @ApiProperty({ type: String })
  content: string;
}
