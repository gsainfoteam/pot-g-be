import { IsBoolean } from "class-validator";

export class UpdateRouteDeletedRequestDto {
  @IsBoolean()
  is_deleted: boolean;
}
