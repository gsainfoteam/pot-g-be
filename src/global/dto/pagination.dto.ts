import { ApiProperty } from "@nestjs/swagger";
export class PaginationDto<T> {
  @ApiProperty({ type: Number })
  total: number;
  @ApiProperty({ type: Number })
  offset: number;
  @ApiProperty({ type: Number })
  limit: number;
  @ApiProperty({ type: Object, isArray: true })
  list: T[];
}
