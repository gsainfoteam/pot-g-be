import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { userBank } from "../../../drizzle/schema/user-bank";
import { UserBankEntity } from "@src/accounting/model/user-bank.entity";
import { eq } from "drizzle-orm";
import { TxType } from "@src/global/types/tx.types";

@Injectable()
export class UserBankRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT ub.user_fk, ub.bank_fk, ub.account
  FROM user_banks AS ub
   WHERE user_fk = ?
   */
  async findByUserPk(userPk: string): Promise<UserBankEntity | null> {
    const results = await this.dbService.db
      .select({
        userFk: userBank.userFk,
        bankFk: userBank.bankFk,
        account: userBank.account,
      })
      .from(userBank)
      .where(eq(userBank.userFk, userPk));

    if (results.length === 0) {
      return null;
    } else {
      return this.resultToUserBankEntity(results[0]);
    }
  }

  async insert(
    userBankEntity: UserBankEntity,
    tx: TxType,
  ): Promise<UserBankEntity | null> {
    const result = await tx
      .insert(userBank)
      .values({
        userFk: userBankEntity.userFk,
        bankFk: userBankEntity.bankFk,
        account: userBankEntity.account,
      })
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to insert user bank"); // TODO
    }

    return this.resultToUserBankEntity(result[0]);
  }

  async update(userBankEntity: UserBankEntity, tx: TxType) {
    await tx.update(userBank).set({
      bankFk: userBankEntity.bankFk,
      account: userBankEntity.account,
    });
  }

  private resultToUserBankEntity(result: any): UserBankEntity {
    return {
      userFk: result.userFk,
      bankFk: result.bankFk,
      account: result.account,
    };
  }
}
