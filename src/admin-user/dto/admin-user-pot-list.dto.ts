import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

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

export class AdminUserPotListItemDto {
  pk: string;
  name: string;
  is_archived: boolean;
  is_deleted: boolean;
  is_departure_confirmed: boolean;
  starts_at: Date;
  ends_at: Date;
  created_at: Date;
}

export class AdminUserPotListResDto {
  items: AdminUserPotListItemDto[];
  total: number;
  page: number;
  size: number;
}
