import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import {
  AdminAccountEntity,
  AdminAccountRole,
} from "@src/database/entity/admin-account.entity";
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

  /*
  SELECT * FROM admin_account WHERE pk = ?1;
   */
  async findByPk(pk: string): Promise<AdminAccountEntity | null> {
    const results = await this.dbService.db
      .select()
      .from(adminAccount)
      .where(eq(adminAccount.pk, pk));

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
        role: AdminAccountRole[adminAccountEntity.role] as
          | "admin"
          | "superadmin",
      })
      .returning();

    if (result.length === 0) {
      throw new PotgDBError("Failed to insert admin account");
    }

    return this.resultToAdminAccountEntity(result[0]);
  }

  async update(
    adminAccountEntity: AdminAccountEntity,
    tx: TxType,
  ): Promise<AdminAccountEntity> {
    const result = await tx
      .update(adminAccount)
      .set({
        role: AdminAccountRole[adminAccountEntity.role] as
          | "admin"
          | "superadmin",
        updatedAt: new Date(),
      })
      .where(eq(adminAccount.pk, adminAccountEntity.pk!))
      .returning();

    if (result.length === 0) {
      throw new PotgDBError("Failed to update admin account");
    }

    return this.resultToAdminAccountEntity(result[0]);
  }

  /*
  DELETE FROM admin_account WHERE pk = ?1 AND role = 'admin' RETURNING pk;
   */
  async deleteAdminByPk(pk: string, tx: TxType): Promise<boolean> {
    const result = await tx
      .delete(adminAccount)
      .where(and(eq(adminAccount.pk, pk), eq(adminAccount.role, "admin")))
      .returning({ pk: adminAccount.pk });

    return result.length > 0;
  }

  private resultToAdminAccountEntity(result: any): AdminAccountEntity {
    return {
      pk: result.pk,
      email: result.email,
      role: AdminAccountRole[result.role as "admin" | "superadmin"],
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }
}
