import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import { BankDto } from "@src/accounting/dto/bank.dto";
import { ChangeAccountingRequestDto } from "@src/accounting/dto/change-accounting.dto";
import { AccountingDto } from "@src/user/dto/accounting.dto";
import { UserContext } from "@src/auth/user-context.entity";
import { BankEntity } from "@src/database/model/bank.entity";
import { BankRepository } from "@src/database/repository/bank.repository";
import { UserBankRepository } from "@src/database/repository/user-bank.repository";
import { UserBankEntity } from "@src/database/model/user-bank.entity";
import { DatabaseService } from "@src/database/database.service";
import { TxType } from "@src/global/types/tx.types";

@Injectable()
export class AccountingService implements OnModuleInit {
  private readonly ACCOUNT_REGEX = new RegExp(/^(\d+)$/);
  private cachedBanks: BankEntity[] = [];

  constructor(
    private readonly dbService: DatabaseService,
    private readonly bankRepository: BankRepository,
    private readonly userBankRepository: UserBankRepository,
  ) {}

  async onModuleInit() {
    await this.cacheBanks();
  }

  async changeAccounting(
    req: ChangeAccountingRequestDto,
    userCtx: UserContext,
  ): Promise<AccountingDto> {
    // Check if req.bank_pk is valid
    const requestedBank = this.cachedBanks.find((b) => b.pk === req.bank_pk);
    if (!requestedBank) {
      // TODO
      throw new BadRequestException("Invalid bank_pk");
    }

    // Check if req.account is valid
    if (!this.ACCOUNT_REGEX.test(req.account)) {
      // TODO
      throw new BadRequestException("Invalid account format");
    }

    // Find existing user bank
    const userBank: UserBankEntity = await this.userBankRepository.findByUserPk(
      userCtx.userId,
    );

    await this.dbService.db.transaction(async (tx: TxType) => {
      if (userBank) {
        // Update existing user bank
        await this.updateUserBank(userBank, requestedBank, req.account, tx);
      } else {
        // Insert new user bank
        await this.insertNewUserBank(
          userCtx.userId,
          requestedBank,
          req.account,
          tx,
        );
      }
    });

    return {
      is_set: true,
      bank_short_name: requestedBank.bankShortName,
      account: req.account,
    };
  }

  async getBanks(): Promise<BankDto[]> {
    return this.cachedBanks.map((bankEntity) => {
      return {
        id: bankEntity.pk,
        bank_full_name: bankEntity.bankFullName,
        logo: bankEntity.logo,
      };
    });
  }

  private async insertNewUserBank(
    userPk: string,
    bank: BankEntity,
    account: string,
    tx: TxType,
  ): Promise<void> {
    const newUserBank: UserBankEntity = {
      userFk: userPk,
      bankFk: bank.pk,
      account: account,
    };
    await this.userBankRepository.insert(newUserBank, tx);
  }

  private async updateUserBank(
    userBank: UserBankEntity,
    bank: BankEntity,
    account: string,
    tx: TxType,
  ): Promise<void> {
    userBank.bankFk = bank.pk;
    userBank.account = account;
    await this.userBankRepository.update(userBank, tx);
  }

  private async cacheBanks() {
    this.cachedBanks = await this.bankRepository.findAll();
  }
}
