import { ApiPropertyOptional } from "@nestjs/swagger";
export class PushSettingDto {
  @ApiPropertyOptional({ type: Boolean })
  chat_push?: boolean;
  @ApiPropertyOptional({ type: Boolean })
  pot_in_out_push?: boolean;
  @ApiPropertyOptional({ type: Boolean })
  marketing_push?: boolean;
}
