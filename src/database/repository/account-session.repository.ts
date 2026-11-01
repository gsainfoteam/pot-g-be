import { Injectable } from "@nestjs/common";
import type { SessionRecord, SessionStore } from "@gsainfoteam/account-nest";
import { and, eq, isNull, lt } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import { TxType } from "@src/global/types/tx.types";
import { accountSession } from "../../../drizzle/schema/account-session";

@Injectable()
export class AccountSessionRepository implements SessionStore {
  constructor(private readonly dbService: DatabaseService) {}

  async save(record: SessionRecord): Promise<void> {
    await this.dbService.db.insert(accountSession).values(record);
  }

  async find(tokenHash: string) {
    const [row] = await this.dbService.db
      .select()
      .from(accountSession)
      .where(eq(accountSession.tokenHash, tokenHash));
    return row ?? null;
  }

  async markUsed(tokenHash: string, at: Date): Promise<boolean> {
    // usedAt 이 비어 있을 때만 갱신해야 동시에 온 refresh 중 하나만 성공합니다.
    const marked = await this.dbService.db
      .update(accountSession)
      .set({ usedAt: at })
      .where(
        and(
          eq(accountSession.tokenHash, tokenHash),
          isNull(accountSession.usedAt),
        ),
      )
      .returning({ tokenHash: accountSession.tokenHash });
    return marked.length > 0;
  }

  async deleteUsed(sessionId: string, before: Date): Promise<void> {
    await this.dbService.db
      .delete(accountSession)
      .where(
        and(
          eq(accountSession.sessionId, sessionId),
          lt(accountSession.usedAt, before),
        ),
      );
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.dbService.db
      .delete(accountSession)
      .where(eq(accountSession.sessionId, sessionId));
  }

  async deleteSubject(subject: string): Promise<void> {
    await this.dbService.db
      .delete(accountSession)
      .where(eq(accountSession.subject, subject));
  }

  async deleteExpired(tx: TxType): Promise<number> {
    const deleted = await tx
      .delete(accountSession)
      .where(lt(accountSession.expiresAt, new Date()))
      .returning({ tokenHash: accountSession.tokenHash });
    return deleted.length;
  }
}
