import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { AdminPopoMessageStatusService } from "@src/admin-popo-message/admin-popo-message-status.service";
import {
  PopoReservationListResDto,
  PopoSentListResDto,
  PopoStatusListReqDto,
} from "@src/admin-popo-message/dto/popo-message-status.dto";

@Controller("/api/manager/v1/popo-message-status")
@UseGuards(ManagerGuard)
export class AdminPopoMessageStatusController {
  constructor(private readonly service: AdminPopoMessageStatusService) {}

  @Get("/reservations")
  async listReservations(
    @Query() req: PopoStatusListReqDto,
  ): Promise<PopoReservationListResDto> {
    return this.service.listReservations(req);
  }

  @Get("/sent")
  async listSent(
    @Query() req: PopoStatusListReqDto,
  ): Promise<PopoSentListResDto> {
    return this.service.listSent(req);
  }
}
