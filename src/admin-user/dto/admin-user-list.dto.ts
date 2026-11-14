import { Type } from "class-transformer";
import { IsOptional, IsString, Max, Min, MaxLength, IsUUID, IsIn, IsInt } from "class-validator";

export type AdminUserStatus = "active" | "withdrawn" | "all";

export class AdminUserListReqDto {
    @IsOptional()
    @IsUUID()
    pk?: string;

    @IsOptional()
    @IsString()
    @MaxLength(64)
    idp_sub?: string;

    @IsOptional()
    @IsIn(['active', 'withdrawn', 'all'])
    status: AdminUserStatus = "active";

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

export class AdminUserListItemDto {
    pk: string;
    name: string | null;
    email: string | null;
    is_deleted: boolean;
    created_at: Date;
}

export class AdminUserListResDto {
    items: AdminUserListItemDto[];
    total: number;
    page: number;
    size: number;
} 