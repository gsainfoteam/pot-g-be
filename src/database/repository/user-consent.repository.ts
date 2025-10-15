import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { TxType } from "@src/global/types/tx.types";
import { eq } from "drizzle-orm";
import { UserConsentEntity } from "@src/database/entity/user-consent.entity";
import { userConsent } from "../../../drizzle/schema/user-consent";

@Injectable()
export class UserConsentRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * FROM user_consent WHERE user_fk = ?1;
   */
  async findByUserFk(userFk: string): Promise<UserConsentEntity[]> {
    const results = await this.dbService.db
      .select()
      .from(userConsent)
      .where(eq(userConsent.userFk, userFk));

    return results.map((result) => this.resultToUserConsentEntity(result));
  }

  async insert(
    userConsentEntity: UserConsentEntity,
    tx: TxType,
  ): Promise<UserConsentEntity | null> {
    const result = await tx
      .insert(userConsent)
      .values({
        userFk: userConsentEntity.userFk,
        term: userConsentEntity.term,
        createdAt: userConsentEntity.createdAt || new Date(),
        updatedAt: userConsentEntity.updatedAt || new Date(),
      })
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to insert device"); // TODO
    }

    const insertedUserConsent = result[0];
    return this.resultToUserConsentEntity(insertedUserConsent);
  }

  private resultToUserConsentEntity(result: any): UserConsentEntity {
    return {
      userFk: result.userFk,
      term: result.term,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }
}
