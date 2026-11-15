import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class UpdateStopRequestDto {
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

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsLongitude()
  lng?: number;
}
