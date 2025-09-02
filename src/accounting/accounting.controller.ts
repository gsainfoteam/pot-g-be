import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { BankDto } from "@src/accounting/dto/bank.dto";
import { AccountingService } from "@src/accounting/accounting.service";
import { ChangeAccountingRequestDto } from "@src/accounting/dto/change-accounting.dto";
import { AccountingDto } from "@src/user/dto/accounting.dto";
import { AuthGuard } from "@nestjs/passport";
import { GetUser } from "@src/global/decorator/get-user.decorator";
import { UserContext } from "@src/auth/user-context.entity";

@Controller("/api/v1/accounting")
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post("/me")
  @UseGuards(AuthGuard)
  async changeAccounting(
    @Body() req: ChangeAccountingRequestDto,
    @GetUser() userCtx: UserContext,
  ): Promise<AccountingDto> {
    return await this.accountingService.changeAccounting(req, userCtx);
  }

  @Get("/bank")
  @UseGuards(AuthGuard)
  async getBanks(): Promise<BankDto[]> {
    return this.accountingService.getBanks();
  }
}
