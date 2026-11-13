import { ApiInternalServerErrorResponse } from "@nestjs/swagger";
import { HttpErrorDto } from "@src/global/dto/http-error.dto";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { PotService } from "@src/pot/pot.service";
import { CreatePotReqDto, CreatePotResDto } from "@src/pot/dto/create.pot.dto";
import { UserGuard } from "@src/auth/guard/user.guard";
import { GetUser } from "@src/global/decorator/get-user.decorator";
import { UserContext } from "@src/auth/context/user-context.entity";
import { BaseResultDto } from "@src/global/dto/base-result.dto";
import { MyPotResDto } from "@src/pot/dto/my.pot.dto";
import { PotInfoDto } from "@src/pot/dto/pot.info.dto";
import {
  PotEventListReqDto,
  PotEventListResDto,
} from "@src/pot/dto/pot.event.dto";
import { PotOverviewDto } from "@src/pot/dto/pot.overview.dto";
import { ConfirmDepartureTimeDto } from "@src/pot/dto/confirm-departure-time.pot.dto";
import { ReportUserReqDto } from "@src/pot/dto/report-user.pot.dto";

@ApiInternalServerErrorResponse({
  type: HttpErrorDto,
  description: "서버 내부 오류",
})
@ApiTags("Pot")
@Controller("/api/v1/pot")
export class PotController {
  constructor(private readonly potService: PotService) {}

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "팟 생성" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 201, type: CreatePotResDto })
  @Post("/create")
  @UseGuards(UserGuard)
  async createPot(
    @Body() req: CreatePotReqDto,
    @GetUser() userCtx: UserContext,
  ): Promise<CreatePotResDto> {
    return this.potService.createPot(req, userCtx);
  }

  @ApiOperation({ summary: "내 참여·보관 팟 조회" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: MyPotResDto })
  @Get("/me")
  @UseGuards(UserGuard)
  async getMyPot(@GetUser() userCtx: UserContext): Promise<MyPotResDto> {
    return this.potService.getMyPot(userCtx);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiResponse({
    status: 403,
    type: HttpErrorDto,
    description: "접근 권한 없음",
  })
  @ApiOperation({ summary: "팟 상세 정보 조회" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: PotInfoDto })
  @Get("/:potPk/info")
  @UseGuards(UserGuard)
  async getPotInfo(
    @Param("potPk") potPk: string,
    @GetUser() userCtx: UserContext,
  ): Promise<PotInfoDto> {
    return this.potService.getPotInfo(potPk, userCtx);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "팟 개요 조회" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: PotOverviewDto })
  @Get("/:potPk/overview")
  @UseGuards(UserGuard)
  async getPotOverview(@Param("potPk") potPk: string): Promise<PotOverviewDto> {
    return this.potService.getPotOverview(potPk);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiResponse({
    status: 403,
    type: HttpErrorDto,
    description: "접근 권한 없음",
  })
  @ApiOperation({ summary: "팟 이벤트 조회" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: PotEventListResDto })
  @Get(":potPk/events")
  @UseGuards(UserGuard)
  async getPotEvents(
    @Param("potPk") potPk: string,
    @Query() req: PotEventListReqDto,
    @GetUser()
    userCtx: UserContext,
  ): Promise<PotEventListResDto> {
    return this.potService.getPotEvents(potPk, req, userCtx);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "팟 참여" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 201, type: BaseResultDto })
  @Post("/:potPk/in")
  @UseGuards(UserGuard)
  async enterPot(
    @Param("potPk") potPk: string,
    @GetUser() userCtx: UserContext,
  ): Promise<BaseResultDto> {
    return this.potService.enterPot(potPk, userCtx);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "팟 나가기" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 201, type: BaseResultDto })
  @Post("/:potPk/out")
  @UseGuards(UserGuard)
  async leavePot(
    @Param("potPk") potPk: string,
    @GetUser() userCtx: UserContext,
  ): Promise<BaseResultDto> {
    return this.potService.leavePot(potPk, userCtx);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["user_id"],
      properties: {
        user_id: { type: "string", description: "강퇴할 사용자 ID" },
      },
    },
  })
  @ApiOperation({ summary: "참여자 강퇴" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 201, type: BaseResultDto })
  @Post("/:potPk/kick")
  @UseGuards(UserGuard)
  async kickUserFromPot(
    @Param("potPk") potPk: string,
    @Body("user_id") targetUserId: string,
    @GetUser() userCtx: UserContext,
  ): Promise<BaseResultDto> {
    return this.potService.kickUserFromPot(potPk, targetUserId, userCtx);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "출발 시간 확정" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 201, type: BaseResultDto })
  @Post("/:potPk/departure/confirm")
  @UseGuards(UserGuard)
  async confirmDepartureTime(
    @Param("potPk") potPk: string,
    @Body() req: ConfirmDepartureTimeDto,
    @GetUser() userCtx: UserContext,
  ): Promise<BaseResultDto> {
    return this.potService.confirmDepartureTime(potPk, req, userCtx);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiResponse({
    status: 403,
    type: HttpErrorDto,
    description: "접근 권한 없음",
  })
  @ApiOperation({ summary: "사용자 신고" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 201, type: BaseResultDto })
  @Post("/:potPk/report")
  @UseGuards(UserGuard)
  async reportUser(
    @Param("potPk") potPk: string,
    @Body() req: ReportUserReqDto,
    @GetUser() userCtx: UserContext,
  ): Promise<BaseResultDto> {
    return this.potService.reportUser(potPk, req, userCtx);
  }
}
