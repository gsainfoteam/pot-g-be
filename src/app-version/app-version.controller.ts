import { ApiInternalServerErrorResponse } from "@nestjs/swagger";
import { HttpErrorDto } from "@src/global/dto/http-error.dto";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Controller, Get } from "@nestjs/common";
import { AppVersionService } from "@src/app-version/app-version.service";
import { VersionDto } from "@src/app-version/dto/version.dto";

@ApiInternalServerErrorResponse({
  type: HttpErrorDto,
  description: "서버 내부 오류",
})
@ApiTags("AppVersion")
@Controller("/api/v1/version")
export class AppVersionController {
  constructor(private readonly appVersionService: AppVersionService) {}

  @ApiOperation({ summary: "앱 최소·최신 버전 조회" })
  @ApiResponse({ status: 200, type: VersionDto })
  @Get()
  async getVersion(): Promise<VersionDto> {
    return this.appVersionService.getVersion();
  }
}
