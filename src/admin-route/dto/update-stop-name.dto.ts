import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateStopNameRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(127)
  name_kor: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(127)
  name_eng: string;
}
