import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import { AdminPotDto } from "@src/admin-pot/dto/admin-pot.dto";

export class AdminUserPotListReqDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size: number = 10;
}

export class AdminUserPotListItemDto extends AdminPotDto {
  is_archived: boolean;
  is_deleted: boolean;
  is_departure_confirmed: boolean;
}

export class AdminUserPotListResDto {
  items: AdminUserPotListItemDto[];
  total: number;
  page: number;
  size: number;
}
