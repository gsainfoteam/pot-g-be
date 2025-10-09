import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { BankDto } from "@src/accounting/dto/bank.dto";
import { AccountingService } from "@src/accounting/accounting.service";
import { ChangeAccountingRequestDto } from "@src/accounting/dto/change-accounting.dto";
import { AccountingDto } from "@src/user/dto/accounting.dto";
import { GetUser } from "@src/global/decorator/get-user.decorator";
import { UserContext } from "@src/auth/user-context.entity";
import { UserGuard } from "@src/auth/guard/user.guard";
import { RequestAccountingRequestDto } from "@src/accounting/dto/request-accounting.dto";
import { BaseResultDto } from "@src/global/dto/base-result.dto";
import { ConfirmAccountingRequestDto } from "@src/accounting/dto/confirm-accounting.dto";

@Controller("/api/v1/accounting")
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post("/me")
  @UseGuards(UserGuard)
  async changeAccounting(
    @Body() req: ChangeAccountingRequestDto,
    @GetUser() userCtx: UserContext,
  ): Promise<AccountingDto> {
    return await this.accountingService.changeAccounting(req, userCtx);
  }

  @Get("/bank")
  @UseGuards(UserGuard)
  async getBanks(): Promise<BankDto[]> {
    return this.accountingService.getBanks();
  }

  @Post("/pot/:potPk/request")
  @UseGuards(UserGuard)
  async requestAccounting(
    @Param("potPk") potPk: string,
    @Body() req: RequestAccountingRequestDto,
    @GetUser() userCtx: UserContext,
  ): Promise<BaseResultDto> {
    return this.accountingService.requestAccounting(potPk, req, userCtx);
  }

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
