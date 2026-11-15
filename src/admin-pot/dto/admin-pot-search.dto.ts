import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { AdminPotDto } from "@src/admin-pot/dto/admin-pot.dto";

export class AdminPotSearchReqDto {
  @ApiPropertyOptional({ type: String, maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;
}

export class AdminPotListReqDto extends AdminPotSearchReqDto {
  @ApiPropertyOptional({
    type: "integer",
    default: 0,
    minimum: 0,
    description: "0부터 시작",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page: number = 0; // 0부터 시작

  @ApiPropertyOptional({
    type: "integer",
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size: number = 10;
}

export class AdminPotListResDto {
  @ApiProperty({ type: () => AdminPotDto, isArray: true })
  items: AdminPotDto[];
  @ApiProperty({ type: Number })
  total: number;
  @ApiProperty({ type: Number })
  page: number;
  @ApiProperty({ type: Number })
  size: number;
}
