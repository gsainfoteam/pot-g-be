import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { AdminPopoMessageService } from "@src/admin-popo-message/admin-popo-message.service";
import { PopoMessageDto } from "@src/admin-popo-message/dto/popo-message.dto";
import { UpdatePopoMessageRequestDto } from "@src/admin-popo-message/dto/update-popo-message.dto";

@Controller("/api/manager/v1/popo-messages")
@UseGuards(ManagerGuard)
export class AdminPopoMessageController {
  constructor(private readonly service: AdminPopoMessageService) {}

  @Get()
  async list(): Promise<PopoMessageDto[]> {
    return this.service.list();
  }

  @Patch("/:type")
  async update(
    @Param("type") type: string,
    @Body() req: UpdatePopoMessageRequestDto,
  ): Promise<PopoMessageDto> {
    return this.service.update(type, req);
  }
}
