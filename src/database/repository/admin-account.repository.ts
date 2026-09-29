import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import { AdminAccountEntity } from "@src/database/entity/admin-account.entity";
import { adminAccount } from "../../../drizzle/schema/admin-account";
import { PotgDBError } from "@src/global/exceptions/potg-db.error";
import { TxType } from "@src/global/types/tx.types";

@Injectable()
export class AdminAccountRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * FROM admin_account;
   */
  async findAll(): Promise<AdminAccountEntity[]> {
    const results = await this.dbService.db.select().from(adminAccount);

    return results.map((result) => this.resultToAdminAccountEntity(result));
  }

  /*
  SELECT * FROM admin_account WHERE email = ?1;
   */
  async findByEmail(email: string): Promise<AdminAccountEntity | null> {
    const results = await this.dbService.db
      .select()
      .from(adminAccount)
      .where(eq(adminAccount.email, email));

    if (results.length === 0) {
      return null;
    }

    return this.resultToAdminAccountEntity(results[0]);
  }

  async insert(
    adminAccountEntity: AdminAccountEntity,
    tx: TxType,
  ): Promise<AdminAccountEntity> {
    const result = await tx
      .insert(adminAccount)
      .values({
        pk: adminAccountEntity.pk || randomUUID(),
        email: adminAccountEntity.email,
        role: adminAccountEntity.role,
      })
      .returning();

    if (result.length === 0) {
      throw new PotgDBError("Failed to insert admin account");
    }

    return this.resultToAdminAccountEntity(result[0]);
  }

  async deleteByPk(pk: string, tx: TxType): Promise<void> {
    await tx.delete(adminAccount).where(eq(adminAccount.pk, pk));
  }

  private resultToAdminAccountEntity(result: any): AdminAccountEntity {
    return {
      pk: result.pk,
      email: result.email,
      role: result.role,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }
}
