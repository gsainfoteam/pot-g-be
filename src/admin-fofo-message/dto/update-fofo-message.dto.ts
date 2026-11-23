import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class UpdateFofoMessageRequestDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  message: string;

  @IsBoolean()
  enabled: boolean;

  /** Ignored for immediate-send messages. */
  @IsOptional()
  @IsInt()
  @Min(-43200)
  @Max(43200)
  offset_minutes?: number | null;
}
