import { RouteDto } from "@src/discovery/dto/route.dto";

export class PotDto {
  id: string;
  name: string;
  route: RouteDto[];
  starts_at: Date;
  ends_at: Date;
  current: number;
  total: number;
}
