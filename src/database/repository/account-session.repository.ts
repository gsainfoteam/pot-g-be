import { Injectable } from "@nestjs/common";
import {
  accountSession,
  drizzleSessionStore,
} from "@gsainfoteam/account-nest/drizzle";
import { lt } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import { TxType } from "@src/global/types/tx.types";

@Injectable()
export class AccountSessionRepository {
  readonly store: ReturnType<typeof drizzleSessionStore>;

  constructor(dbService: DatabaseService) {
    this.store = drizzleSessionStore(dbService.db);
  }

  async deleteExpired(tx: TxType): Promise<number> {
    const deleted = await tx
      .delete(accountSession)
      .where(lt(accountSession.expiresAt, new Date()))
      .returning({ tokenHash: accountSession.tokenHash });
    return deleted.length;
  }
}
