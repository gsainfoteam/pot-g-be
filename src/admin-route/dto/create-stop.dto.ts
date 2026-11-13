import { ApiProperty } from "@nestjs/swagger";
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateStopRequestDto {
  @ApiProperty({ type: String, maxLength: 127 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(127)
  name_kor: string;

  @ApiProperty({ type: String, maxLength: 127 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(127)
  name_eng: string;

  @ApiProperty({ type: Number })
  @IsLatitude()
  lat: number;

  @ApiProperty({ type: Number })
  @IsLongitude()
  lng: number;
}
