import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
export class PotEventUserLeaveV1Dto {
  @ApiProperty({ type: String })
  user_pk: string;
  @ApiPropertyOptional({ type: String })
  host_changed_to?: string;
}
