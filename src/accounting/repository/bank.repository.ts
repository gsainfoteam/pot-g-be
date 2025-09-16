import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { BankEntity } from "@src/accounting/model/bank.entity";
import { bank } from "../../../drizzle/schema/bank";

@Injectable()
export class BankRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * from banks
   */
  async findAll(): Promise<BankEntity[]> {
    const results = await this.dbService.db
      .select({
        pk: bank.pk,
        bankFullName: bank.bankFullName,
        bankShortName: bank.bankShortName,
        logo: bank.logo,
      })
      .from(bank);

    return results.map((result) => this.resultToBankEntity(result));
  }

  private resultToBankEntity(result: any): BankEntity {
    return {
      pk: result.pk,
      bankFullName: result.bankFullName,
      bankShortName: result.bankShortName,
      logo: result.logo,
    };
  }
}
