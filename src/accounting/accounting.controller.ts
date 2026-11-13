import { ApiInternalServerErrorResponse } from "@nestjs/swagger";
import { HttpErrorDto } from "@src/global/dto/http-error.dto";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiResponse,
} from "@nestjs/swagger";
import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { BankDto } from "@src/accounting/dto/bank.dto";
import { AccountingService } from "@src/accounting/accounting.service";
import { ChangeAccountingRequestDto } from "@src/accounting/dto/change-accounting.dto";
import { AccountingDto } from "@src/user/dto/accounting.dto";
import { GetUser } from "@src/global/decorator/get-user.decorator";
import { UserContext } from "@src/auth/context/user-context.entity";
import { UserGuard } from "@src/auth/guard/user.guard";
import { RequestAccountingRequestDto } from "@src/accounting/dto/request-accounting.dto";
import { BaseResultDto } from "@src/global/dto/base-result.dto";
import { ConfirmAccountingRequestDto } from "@src/accounting/dto/confirm-accounting.dto";

@ApiInternalServerErrorResponse({
  type: HttpErrorDto,
  description: "서버 내부 오류",
})
@ApiTags("Accounting")
@Controller("/api/v1/accounting")
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "내 정산 계좌 변경" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 201, type: AccountingDto })
  @Post("/me")
  @UseGuards(UserGuard)
  async changeAccounting(
    @Body() req: ChangeAccountingRequestDto,
    @GetUser() userCtx: UserContext,
  ): Promise<AccountingDto> {
    return await this.accountingService.changeAccounting(req, userCtx);
  }

  @ApiOperation({ summary: "은행 목록 조회" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: BankDto, isArray: true })
  @Get("/bank")
  @UseGuards(UserGuard)
  async getBanks(): Promise<BankDto[]> {
    return this.accountingService.getBanks();
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "팟 정산 요청" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 201, type: BaseResultDto })
  @Post("/pot/:potPk/request")
  @UseGuards(UserGuard)
  async requestAccounting(
    @Param("potPk") potPk: string,
    @Body() req: RequestAccountingRequestDto,
    @GetUser() userCtx: UserContext,
  ): Promise<BaseResultDto> {
    return this.accountingService.requestAccounting(potPk, req, userCtx);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "팟 송금 확인" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 201, type: BaseResultDto })
  @Post("/pot/:potPk/confirm")
  @UseGuards(UserGuard)
  async confirmAccounting(
    @Param("potPk") potPk: string,
    @Body() req: ConfirmAccountingRequestDto,
    @GetUser() userCtx: UserContext,
  ): Promise<BaseResultDto> {
    return this.accountingService.confirmAccounting(potPk, req, userCtx);
  }
}
