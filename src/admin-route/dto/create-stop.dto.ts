import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateStopRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(127)
  name_kor: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(127)
  name_eng: string;

  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}
