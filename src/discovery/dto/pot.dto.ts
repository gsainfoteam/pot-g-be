import { RouteDto } from "@src/discovery/dto/route.dto";

export class PotDto {
  id: string;
  name: string;
  route: RouteDto;
  starts_at: string;
  ends_at: string;
  current: number;
  total: number;
}
