import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AppVersionService } from "@src/app-version/app-version.service";
import { VersionDto } from "@src/app-version/dto/version.dto";
import { VersionUpdateDto } from "@src/app-version/dto/version.update.dto";
import { ManagerGuard } from "@src/auth/guard/manager.guard";

@Controller("/api/manager/v1/version")
export class AppVersionManagerController {
  constructor(private readonly appVersionService: AppVersionService) {}

  @Post()
  @UseGuards(ManagerGuard)
  async updateVersion(@Body() req: VersionUpdateDto): Promise<VersionDto> {
    return this.appVersionService.updateVersion(req);
  }
}
