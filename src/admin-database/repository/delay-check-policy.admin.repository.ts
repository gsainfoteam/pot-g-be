import { Injectable } from "@nestjs/common";
import { TxType } from "@src/global/types/tx.types";
import { eq } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import { delayCheckPolicy } from "../../../drizzle/schema/delay-check-policy";

type DelayCheckPolicyRow = typeof delayCheckPolicy.$inferSelect;

type UpdateDelayCheckPolicyValues = {
  enabled: boolean;
  minutesBeforeDeparture: number;
};

const POLICY_KEY = "default";

@Injectable()
export class DelayCheckPolicyAdminRepository {
  constructor(
    private readonly dbService: DatabaseService,
  ) {}

  /*
  SELECT * FROM delay_check_policy WHERE key = 'default';
   */
  async find(tx?: TxType): Promise<DelayCheckPolicyRow | null> {
    const db = tx ? tx : this.dbService.db;

    const [policy] = await db
      .select()
      .from(delayCheckPolicy)
      .where(eq(delayCheckPolicy.key, POLICY_KEY));

    return policy ?? null;
  }

  /*
  INSERT INTO delay_check_policy (key, enabled, minutes_before_departure, updated_at)
  VALUES ('default', $1, $2, $3)
  ON CONFLICT (key) DO UPDATE
  SET enabled = $1, minutes_before_departure = $2, updated_at = $3
  RETURNING *;
   */
  async save(
    values: UpdateDelayCheckPolicyValues,
  ): Promise<DelayCheckPolicyRow> {
    const updatedAt = new Date();

    const [policy] = await this.dbService.db
      .insert(delayCheckPolicy)
      .values({
        key: POLICY_KEY,
        enabled: values.enabled,
        minutesBeforeDeparture: values.minutesBeforeDeparture,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: delayCheckPolicy.key,
        set: {
          enabled: values.enabled,
          minutesBeforeDeparture: values.minutesBeforeDeparture,
          updatedAt,
        },
      })
      .returning();

    return policy;
  }
}
