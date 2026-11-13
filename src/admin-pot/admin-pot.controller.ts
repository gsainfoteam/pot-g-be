import { ApiInternalServerErrorResponse } from "@nestjs/swagger";
import { HttpErrorDto } from "@src/global/dto/http-error.dto";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiResponse,
} from "@nestjs/swagger";
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { AdminPotService } from "@src/admin-pot/admin-pot.service";
import {
  AdminPotListReqDto,
  AdminPotListResDto,
  AdminPotSearchReqDto,
} from "@src/admin-pot/dto/admin-pot-search.dto";
import { AdminPotDto } from "@src/admin-pot/dto/admin-pot.dto";
import { AdminPotDetailDto } from "@src/admin-pot/dto/admin-pot-detail.dto";

@ApiInternalServerErrorResponse({
  type: HttpErrorDto,
  description: "서버 내부 오류",
})
@ApiBearerAuth("manager-access-token")
@ApiTags("AdminPot")
@Controller("/api/manager/v1/pot")
@UseGuards(ManagerGuard)
export class AdminPotController {
  constructor(private readonly adminPotService: AdminPotService) {}

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "전체 팟 검색" })
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: AdminPotListResDto })
  @Get()
  async listAll(@Query() req: AdminPotListReqDto): Promise<AdminPotListResDto> {
    return this.adminPotService.listAll(req);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "활성 팟 검색" })
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: AdminPotListResDto })
  @Get("/active")
  async listActive(
    @Query() req: AdminPotListReqDto,
  ): Promise<AdminPotListResDto> {
    return this.adminPotService.listActive(req);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "정산 지연 팟 검색" })
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: AdminPotDto, isArray: true })
  @Get("/overdue")
  async listOverdue(
    @Query() req: AdminPotSearchReqDto,
  ): Promise<AdminPotDto[]> {
    return this.adminPotService.listOverdue(req);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiResponse({
    status: 404,
    type: HttpErrorDto,
    description: "대상을 찾을 수 없음",
  })
  @ApiOperation({ summary: "관리자 팟 상세 조회" })
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: AdminPotDetailDto })
  @Get("/:pk")
  async getDetail(
    @Param("pk", ParseUUIDPipe) pk: string,
  ): Promise<AdminPotDetailDto> {
    return this.adminPotService.getDetail(pk);
  }
}
