import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { UserAlarmSettingEntity } from "@src/user/model/user-alarm-setting.entity";
import { TxType } from "@src/global/types/tx.types";
import { userAlarmSetting } from "../../../drizzle/schema/user-alarm-setting";

@Injectable()
export class UserAlarmSettingRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async insert(
    userAlarmSettingEntity: UserAlarmSettingEntity,
    tx: TxType,
  ): Promise<UserAlarmSettingEntity> {
    const result = await tx
      .insert(userAlarmSetting)
      .values({
        deviceFk: userAlarmSettingEntity.deviceFk,
        anyPush: userAlarmSettingEntity.anyPush,
        chatPush: userAlarmSettingEntity.chatPush,
        marketingPush: userAlarmSettingEntity.marketingPush,
        potInOutPush: userAlarmSettingEntity.potInOutPush,
      })
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to insert user alarm setting"); // TODO
    }

    const inserted = result[0];

    return {
      pk: inserted.pk,
      deviceFk: inserted.deviceFk,
      anyPush: inserted.anyPush,
      chatPush: inserted.chatPush,
      marketingPush: inserted.marketingPush,
      potInOutPush: inserted.potInOutPush,
    };
  }
}
