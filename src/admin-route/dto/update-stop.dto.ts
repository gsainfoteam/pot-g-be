import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class UpdateStopRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(127)
  name_kor: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(127)
  name_eng: string;

  @IsOptional()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsLongitude()
  lng?: number;
}
