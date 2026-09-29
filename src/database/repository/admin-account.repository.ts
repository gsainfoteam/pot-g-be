import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import {
  AdminAccountEntity,
  AdminAccountRole,
} from "@src/database/entity/admin-account.entity";
import { adminAccount } from "../../../drizzle/schema/admin-account";

@Injectable()
export class AdminAccountRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findAll(): Promise<AdminAccountEntity[]> {
    const results = await this.dbService.db.select().from(adminAccount);

    return results.map((result) => this.resultToAdminAccountEntity(result));
  }

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
    email: string,
    role: AdminAccountRole,
    memo?: string,
  ): Promise<AdminAccountEntity> {
    const result = await this.dbService.db
      .insert(adminAccount)
      .values({
        pk: randomUUID(),
        email,
        role,
        memo,
      })
      .returning();

    return this.resultToAdminAccountEntity(result[0]);
  }

  async deleteByPk(pk: string): Promise<void> {
    await this.dbService.db.delete(adminAccount).where(eq(adminAccount.pk, pk));
  }

  private resultToAdminAccountEntity(result: any): AdminAccountEntity {
    return {
      pk: result.pk,
      email: result.email,
      role: result.role,
      memo: result.memo,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }
}
