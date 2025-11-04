import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { UserAlarmSettingEntity } from "@src/database/entity/user-alarm-setting.entity";
import { TxType } from "@src/global/types/tx.types";
import { userAlarmSetting } from "../../../drizzle/schema/user-alarm-setting";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { PotgDBError } from "@src/global/exceptions/potg-db.error";

@Injectable()
export class UserAlarmSettingRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * FROM user_alarm_setting WHERE device_fk = ?1;
   */
  async findByDeviceFk(
    deviceFk: string,
  ): Promise<UserAlarmSettingEntity | null> {
    const result = await this.dbService.db
      .select()
      .from(userAlarmSetting)
      .where(eq(userAlarmSetting.deviceFk, deviceFk));

    if (result.length === 0) {
      return null;
    }

    const foundSetting = result[0];
    return this.resultToUserAlarmSettingEntity(foundSetting);
  }

  async insert(
    userAlarmSettingEntity: UserAlarmSettingEntity,
    tx: TxType,
  ): Promise<UserAlarmSettingEntity> {
    const result = await tx
      .insert(userAlarmSetting)
      .values({
        pk: userAlarmSettingEntity.pk || randomUUID(),
        deviceFk: userAlarmSettingEntity.deviceFk,
        chatPush: userAlarmSettingEntity.chatPush,
        marketingPush: userAlarmSettingEntity.marketingPush,
        potInOutPush: userAlarmSettingEntity.potInOutPush,
      })
      .returning();

    if (result.length === 0) {
      throw new PotgDBError("Failed to insert user alarm setting");
    }

    const inserted = result[0];
    return this.resultToUserAlarmSettingEntity(inserted);
  }

  async update(userAlarmSettingEntity: UserAlarmSettingEntity, tx: TxType) {
    await tx
      .update(userAlarmSetting)
      .set({
        chatPush: userAlarmSettingEntity.chatPush,
        marketingPush: userAlarmSettingEntity.marketingPush,
        potInOutPush: userAlarmSettingEntity.potInOutPush,
        updatedAt: new Date(),
      })
      .where(eq(userAlarmSetting.pk, userAlarmSettingEntity.pk));
  }

  private resultToUserAlarmSettingEntity(result: any): UserAlarmSettingEntity {
    return {
      pk: result.pk,
      deviceFk: result.deviceFk,
      chatPush: result.chatPush,
      marketingPush: result.marketingPush,
      potInOutPush: result.potInOutPush,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }
}
