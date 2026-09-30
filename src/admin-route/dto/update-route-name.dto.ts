import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateRouteNameRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  short_name_kor: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  short_name_eng: string;
}
