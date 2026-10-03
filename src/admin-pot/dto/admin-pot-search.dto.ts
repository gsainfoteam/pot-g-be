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
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;
}

export class AdminPotListReqDto extends AdminPotSearchReqDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page: number = 0; // 0부터 시작

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size: number = 10;
}

export class AdminPotListResDto {
  items: AdminPotDto[];
  total: number;
  page: number;
  size: number;
}
