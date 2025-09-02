import { Injectable } from "@nestjs/common";
import { BankDto } from "@src/accounting/dto/bank.dto";
import { ChangeAccountingRequestDto } from "@src/accounting/dto/change-accounting.dto";
import { AccountingDto } from "@src/user/dto/accounting.dto";
import { UserContext } from "@src/auth/user-context.entity";

@Injectable()
export class AccountingService {
  constructor() {}

  async changeAccounting(
    req: ChangeAccountingRequestDto,
    userCtx: UserContext,
  ): Promise<AccountingDto> {
    return this.routeService.getRoutesWithStops().map((route) => {
      return {
        id: route.pk,
        from: {
          id: route.fromStopFk,
          name: route.fromStop.nameKor,
        },
        to: {
          id: route.toStopFk,
          name: route.toStop.nameKor,
        },
      };
    });
  }

  async getBanks(): Promise<BankDto[]> {
    return this.routeService.getStops().map((stops) => {
      return {
        id: stops.pk,
        name: stops.nameKor,
      };
    });
  }
}
