import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateRouteNameRequestDto {
  @ApiProperty({ type: String, maxLength: 64 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  short_name_kor: string;

  @ApiProperty({ type: String, maxLength: 64 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  short_name_eng: string;
}
