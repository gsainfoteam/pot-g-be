import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { AdminFofoMessageStatusService } from "@src/admin-fofo-message/admin-fofo-message-status.service";
import {
  FofoReservationListResDto,
  FofoSentListResDto,
  FofoStatusListReqDto,
} from "@src/admin-fofo-message/dto/fofo-message-status.dto";

@Controller("/api/manager/v1/popo-message-status")
@UseGuards(ManagerGuard)
export class AdminFofoMessageStatusController {
  constructor(private readonly service: AdminFofoMessageStatusService) {}

  @Get("/reservations")
  async listReservations(
    @Query() req: FofoStatusListReqDto,
  ): Promise<FofoReservationListResDto> {
    return this.service.listReservations(req);
  }

  @Get("/sent")
  async listSent(
    @Query() req: FofoStatusListReqDto,
  ): Promise<FofoSentListResDto> {
    return this.service.listSent(req);
  }
}
