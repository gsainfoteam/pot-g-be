import { StopDto } from "@src/discovery/dto/stop.dto";

export class RouteDto {
  id: string;
  from: StopDto;
  to: StopDto;
}
