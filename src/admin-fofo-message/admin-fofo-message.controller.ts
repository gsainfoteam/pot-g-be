import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { AdminFofoMessageService } from "@src/admin-fofo-message/admin-fofo-message.service";
import { FofoMessageDto } from "@src/admin-fofo-message/dto/fofo-message.dto";
import { UpdateFofoMessageRequestDto } from "@src/admin-fofo-message/dto/update-fofo-message.dto";

@Controller("/api/manager/v1/popo-messages")
@UseGuards(ManagerGuard)
export class AdminFofoMessageController {
  constructor(private readonly service: AdminFofoMessageService) {}

  @Get()
  async list(): Promise<FofoMessageDto[]> {
    return this.service.list();
  }

  @Patch("/:type")
  async update(
    @Param("type") type: string,
    @Body() req: UpdateFofoMessageRequestDto,
  ): Promise<FofoMessageDto> {
    return this.service.update(type, req);
  }
}
