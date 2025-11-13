import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { TxType } from "@src/global/types/tx.types";
import { eq } from "drizzle-orm";
import { RefreshTokenEntity } from "@src/database/entity/refresh-token.entity";
import { refreshToken } from "../../../drizzle/schema/refresh-token";
import { PotgDBError } from "@src/global/exceptions/potg-db.error";

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * FROM refresh_token WHERE opaque_hash = ?1;
   */
  async findByOpaqueHash(
    opaqueHash: string,
  ): Promise<RefreshTokenEntity | null> {
    const result = await this.dbService.db
      .select()
      .from(refreshToken)
      .where(eq(refreshToken.opaqueHash, opaqueHash));

    if (result.length === 0) {
      return null;
    }

    const foundRefreshToken = result[0];
    return this.resultToRefreshTokenEntity(foundRefreshToken);
  }

  async insert(
    refreshTokenEntity: RefreshTokenEntity,
    tx: TxType,
  ): Promise<RefreshTokenEntity> {
    const result = await tx
      .insert(refreshToken)
      .values({
        opaqueHash: refreshTokenEntity.opaqueHash,
        refreshToken: refreshTokenEntity.refreshToken,
        createdAt: new Date(),
        updatedAt: new Date(),
        userPk: refreshTokenEntity.userPk,
      })
      .returning();

    if (result.length === 0) {
      throw new PotgDBError("Failed to insert refresh token");
    }

    const insertedRefreshToken = result[0];
    return this.resultToRefreshTokenEntity(insertedRefreshToken);
  }

  async deleteByOpaqueHash(opaqueHash: string, tx: TxType): Promise<void> {
    await tx
      .delete(refreshToken)
      .where(eq(refreshToken.opaqueHash, opaqueHash));
  }

  async deleteByUserPk(userPk: string, tx: TxType): Promise<void> {
    await tx.delete(refreshToken).where(eq(refreshToken.userPk, userPk));
  }

  private resultToRefreshTokenEntity(result: any): RefreshTokenEntity {
    return {
      opaqueHash: result.opaqueHash,
      refreshToken: result.refreshToken,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      userPk: result.userPk,
    };
  }
}
