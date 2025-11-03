import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { DeviceEntity } from "@src/database/entity/device.entity";
import { TxType } from "@src/global/types/tx.types";
import { device } from "../../../drizzle/schema/device";
import { and, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { userAlarmSetting } from "../../../drizzle/schema/user-alarm-setting";

@Injectable()
export class DeviceRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * FROM device WHERE deviceId = ?1 and user_fk = ?2;
   */
  async findByDeviceIdAndUserFk(
    deviceId: string,
    userFk: string,
  ): Promise<DeviceEntity | null> {
    const result = await this.dbService.db
      .select()
      .from(device)
      .where(and(eq(device.deviceId, deviceId), eq(device.userFk, userFk)));

    if (result.length === 0) {
      return null;
    }

    const foundDevice = result[0];
    return this.resultToDeviceEntity(foundDevice);
  }

  /*
  SELECT * FROM device WHERE pk = ?1 and user_fk = ?2;
   */
  async findByPkAndUserFk(
    pk: string,
    userFk: string,
  ): Promise<DeviceEntity | null> {
    const result = await this.dbService.db
      .select()
      .from(device)
      .where(and(eq(device.pk, pk), eq(device.userFk, userFk)));

    if (result.length === 0) {
      return null;
    }

    const foundDevice = result[0];
    return this.resultToDeviceEntity(foundDevice);
  }

  /*
  // TODO: LEFT OUTER JOIN + in array 조합이라 마음에 들지 않음
  SELECT d.fcm_token, uas.chat_push, uas.marketing_push, uas.pot_in_out_push
  FROM device AS d
    LEFT OUTER JOIN user_alarm_setting AS uas ON d.pk = uas.device_fk
  WHERE d.user_fk in (?1) AND d.logged_in = true;
   */
  async findFcmTokensByUserFks(userFks: string[]) {
    return await this.dbService.db
      .select({
        fcmToken: device.fcmToken,
        chatPush: userAlarmSetting.chatPush,
        marketingPush: userAlarmSetting.marketingPush,
        potInOutPush: userAlarmSetting.potInOutPush,
      })
      .from(device)
      .leftJoin(userAlarmSetting, eq(device.pk, userAlarmSetting.deviceFk))
      .where(and(inArray(device.userFk, userFks), eq(device.loggedIn, true)));
  }

  async insert(
    deviceEntity: DeviceEntity,
    tx: TxType,
  ): Promise<DeviceEntity | null> {
    const result = await tx
      .insert(device)
      .values({
        pk: deviceEntity.pk || randomUUID(),
        userFk: deviceEntity.userFk,
        deviceId: deviceEntity.deviceId,
        fcmToken: deviceEntity.fcmToken,
        os: deviceEntity.os,
        version: deviceEntity.version,
        loggedIn: deviceEntity.loggedIn,
      })
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to insert device"); // TODO
    }

    const insertedDevice = result[0];
    return this.resultToDeviceEntity(insertedDevice);
  }

  async update(deviceEntity: DeviceEntity, tx: TxType) {
    await tx
      .update(device)
      .set({
        fcmToken: deviceEntity.fcmToken,
        os: deviceEntity.os,
        version: deviceEntity.version,
        updatedAt: new Date(),
        loggedIn: deviceEntity.loggedIn,
      })
      .where(eq(device.pk, deviceEntity.pk));
  }

  private resultToDeviceEntity(result: any): DeviceEntity {
    return {
      pk: result.pk,
      userFk: result.userFk,
      deviceId: result.deviceId,
      fcmToken: result.fcmToken,
      os: result.os,
      version: result.version,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      loggedIn: result.loggedIn,
    };
  }
}
