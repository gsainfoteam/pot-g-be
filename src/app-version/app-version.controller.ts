import { Controller, Get } from "@nestjs/common";
import { AppVersionService } from "@src/app-version/app-version.service";
import { VersionDto } from "@src/app-version/dto/version.dto";

@Controller("/api/v1/version")
export class AppVersionController {
  constructor(private readonly appVersionService: AppVersionService) {}

  @Get()
  async getVersion(): Promise<VersionDto> {
    return this.appVersionService.getVersion();
  }
}
