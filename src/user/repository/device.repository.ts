import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { DeviceEntity } from "@src/user/model/device.entity";
import { TxType } from "@src/global/types/tx.types";
import { device } from "../../../drizzle/schema/device";

@Injectable()
export class DeviceRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async insert(
    deviceEntity: DeviceEntity,
    tx: TxType,
  ): Promise<DeviceEntity | null> {
    const result = await tx
      .insert(device)
      .values({
        userFk: deviceEntity.userFk,
        fcmToken: deviceEntity.fcmToken,
        os: deviceEntity.os,
        version: deviceEntity.version,
      })
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to insert device"); // TODO
    }

    const insertedDevice = result[0];
    return {
      pk: insertedDevice.pk,
      userFk: insertedDevice.userFk,
      fcmToken: insertedDevice.fcmToken,
      os: insertedDevice.os,
      version: insertedDevice.version,
      createdAt: insertedDevice.createdAt,
      updatedAt: insertedDevice.updatedAt,
    };
  }
}
