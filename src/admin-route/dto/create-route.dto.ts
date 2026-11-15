import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateRouteRequestDto {
  @ApiProperty({ type: String, format: "uuid" })
  @IsUUID()
  from_stop_pk: string;

  @ApiProperty({ type: String, format: "uuid" })
  @IsUUID()
  to_stop_pk: string;

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

  @ApiProperty({ type: String, maxLength: 64 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  reverse_short_name_kor: string;

  @ApiProperty({ type: String, maxLength: 64 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  reverse_short_name_eng: string;
}
