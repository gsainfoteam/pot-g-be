import { IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateRouteRequestDto {
  @IsUUID()
  from_stop_pk: string;

  @IsUUID()
  to_stop_pk: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  short_name_kor: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  short_name_eng: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  reverse_short_name_kor: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  reverse_short_name_eng: string;
}
