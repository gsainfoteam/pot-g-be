import { ApiInternalServerErrorResponse } from "@nestjs/swagger";
import { HttpErrorDto } from "@src/global/dto/http-error.dto";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiResponse,
} from "@nestjs/swagger";
import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { AppVersionService } from "@src/app-version/app-version.service";
import { VersionDto } from "@src/app-version/dto/version.dto";
import { VersionUpdateDto } from "@src/app-version/dto/version.update.dto";
import { ManagerGuard } from "@src/auth/guard/manager.guard";

@ApiInternalServerErrorResponse({
  type: HttpErrorDto,
  description: "서버 내부 오류",
})
@ApiBearerAuth("manager-access-token")
@ApiTags("AppVersionManager")
@Controller("/api/manager/v1/version")
@UseGuards(ManagerGuard)
export class AppVersionManagerController {
  constructor(private readonly appVersionService: AppVersionService) {}

  @ApiOperation({ summary: "관리자 앱 버전 조회" })
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: VersionDto })
  @Get()
  async getVersion(): Promise<VersionDto> {
    return this.appVersionService.getVersion();
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "앱 최소·최신 버전 수정" })
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: VersionDto })
  @Patch()
  async updateVersion(@Body() req: VersionUpdateDto): Promise<VersionDto> {
    return this.appVersionService.updateVersion(req);
  }
}
