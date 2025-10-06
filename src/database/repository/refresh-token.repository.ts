import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { TxType } from "@src/global/types/tx.types";
import { eq } from "drizzle-orm";
import { RefreshTokenEntity } from "@src/database/entity/refresh-token.entity";
import { refreshToken } from "../../../drizzle/schema/refresh-token";

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * FROM refresh_token WHERE token_hmac = ?1;
   */
  async findByTokenHmac(tokenHmac: string): Promise<RefreshTokenEntity | null> {
    const result = await this.dbService.db
      .select()
      .from(refreshToken)
      .where(eq(refreshToken.tokenHmac, tokenHmac));

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
        tokenHmac: refreshTokenEntity.tokenHmac,
        refreshToken: refreshTokenEntity.refreshToken,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to insert refresh token"); // TODO
    }

    const insertedRefreshToken = result[0];
    return this.resultToRefreshTokenEntity(insertedRefreshToken);
  }

  private resultToRefreshTokenEntity(result: any): RefreshTokenEntity {
    return {
      tokenHmac: result.tokenHmac,
      refreshToken: result.refreshToken,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }
}
